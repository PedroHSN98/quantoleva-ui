import { Pool } from "pg";
import { evaluateRules, gradeFromRules } from "../src/lib/grading";
import { MeasureError, measure } from "./measure";

const url = process.env.DATABASE_URL;
const location = process.env.WORKER_LOCATION ?? "sa-east";
if (!url) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString: url, max: 3 });
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Claim one job for this location. SKIP LOCKED keeps two workers from taking the same one.
 *  A lock only counts as stale after 8 minutes: longer than the longest allowed run
 *  (5 min navigation + idle wait + saving), so a slow page is never taken over mid-test. */
async function claim() {
  const { rows } = await pool.query(
    `update jobs set locked_at = now(), attempts = attempts + 1
      where id = (
        select j.id from jobs j join locations l on l.id = j.location_id
         where l.slug = $1 and j.attempts < 3
           and (j.locked_at is null or j.locked_at < now() - interval '8 minutes')
         order by j.created_at
         for update of j skip locked limit 1)
      returning id, test_id`,
    [location],
  );
  return rows[0] as { id: string; test_id: string } | undefined;
}

/** Jobs that ran out of attempts (worker crashed mid-test): fail the test, drop the job. */
async function reap() {
  await pool.query(
    `with dead as (delete from jobs where attempts >= 3 and locked_at < now() - interval '8 minutes' returning test_id)
     update tests set status = 'failed', error_code = 'internal', finished_at = now(), updated_at = now()
      where id in (select test_id from dead) and status in ('queued','running')`,
  );
}

async function fail(testId: string, code: string, jobId: string) {
  await pool.query(
    "update tests set status = 'failed', error_code = $2, finished_at = now(), updated_at = now() where id = $1 and status in ('queued','running')",
    [testId, code],
  );
  await pool.query("delete from jobs where id = $1", [jobId]);
}

async function run(job: { id: string; test_id: string }) {
  const t = await pool.query(
    "update tests set status = 'running', started_at = now(), updated_at = now() where id = $1 and status in ('queued','running') returning url",
    [job.test_id],
  );
  if (!t.rows[0]) { await pool.query("delete from jobs where id = $1", [job.id]); return; }
  const testUrl: string = t.rows[0].url;
  console.log(new Date().toISOString(), "measuring", testUrl);

  let m;
  try {
    m = await measure(testUrl);
  } catch (e) {
    const code = e instanceof MeasureError ? e.code : "internal";
    console.log("failed:", code, e instanceof MeasureError ? "" : e);
    await fail(job.test_id, code, job.id);
    return;
  }

  const pageBytes = m.requests.reduce((s, r) => s + r.sizeBytes, 0);
  const rules = evaluateRules(m.requests, m.loadMs, pageBytes);
  const { score, grade } = gradeFromRules(rules);

  const client = await pool.connect();
  try {
    await client.query("begin");
    const claimed = await client.query("select status from tests where id = $1 for update", [job.test_id]);
    if (claimed.rows[0]?.status === "running") {
      for (const r of m.requests) {
        // upsert on (test_id, seq): safe if a retry runs twice
        await client.query(
          `insert into requests (test_id, seq, url, domain, content_type, status_code, size_bytes, start_ms,
              blocked_ms, dns_ms, connect_ms, ssl_ms, send_ms, wait_ms, receive_ms, is_redirect, cacheable, req_headers, res_headers)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
           on conflict (test_id, seq) do nothing`,
          [job.test_id, r.seq, r.url, r.domain, r.contentType, r.statusCode, r.sizeBytes, r.startMs,
            r.blockedMs, r.dnsMs, r.connectMs, r.sslMs, r.sendMs, r.waitMs, r.receiveMs, r.isRedirect, r.cacheable,
            JSON.stringify(r.reqHeaders), JSON.stringify(r.resHeaders)],
        );
      }
      for (const rule of rules) {
        await client.query(
          "insert into rule_results (test_id, rule_key, name, score, advice) values ($1,$2,$3,$4,$5) on conflict (test_id, rule_key) do nothing",
          [job.test_id, rule.key, rule.name, rule.score, rule.advice],
        );
      }
      await client.query(
        `update tests set status = 'done', final_url = $2, grade = $3, score = $4, load_ms = $5, page_bytes = $6,
                request_count = $7, finished_at = now(), updated_at = now() where id = $1`,
        [job.test_id, m.finalUrl, grade, score, m.loadMs, pageBytes, m.requests.length],
      );
    }
    await client.query("delete from jobs where id = $1", [job.id]);
    await client.query("commit");
    console.log("done", testUrl, grade, score);
  } catch (e) {
    await client.query("rollback");
    console.error("save failed", e);
  } finally {
    client.release();
  }
}

async function main() {
  console.log(`worker started, location=${location}`);
  // Heartbeat on its own timer, so the location stays listed while a long test is running.
  const beat = () => pool.query("update locations set worker_seen_at = now() where slug = $1", [location]).catch(console.error);
  await beat();
  const timer = setInterval(beat, 30_000);
  let lastReap = 0;
  while (!stopping) {
    if (Date.now() - lastReap > 60_000) { await reap().catch(console.error); lastReap = Date.now(); }
    const job = await claim().catch((e) => { console.error(e); return undefined; });
    if (!job) { await sleep(1000); continue; }
    await run(job).catch((e) => console.error("run error", e));
  }
  clearInterval(timer);
  await pool.end();
}

main();
