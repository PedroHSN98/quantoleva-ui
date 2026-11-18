// Postgres data layer. Same function signatures as the earlier fake layer, so no screen changed.
import { createHash, randomBytes } from "node:crypto";
import { pool } from "./db";
import { rateLimit } from "./limits";
import { RUNS_PLANNED, type ContentType, type ErrorCode, type HistoryPoint, type Location, type RequestRow, type RuleResult, type TestFrame, type TestRow } from "./types";

export function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET ?? "dev-only-secret";
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}

export async function listLocations(): Promise<Location[]> {
  // Only locations whose worker checked in recently, otherwise a test would wait in the queue forever.
  const { rows } = await pool().query(
    "select slug, name, region from locations where active and worker_seen_at > now() - interval '3 minutes' order by name",
  );
  return rows;
}

export async function getTest(publicId: string): Promise<TestRow | null> {
  const { rows } = await pool().query(
    `select t.public_id, t.url, l.slug as location_slug, t.status, t.error_code, t.grade, t.score,
            t.load_ms, t.page_bytes, t.request_count, t.created_at, t.started_at, t.finished_at, t.runs_done, t.id, t.idle_ms, t.idle_reached,
            t.fcp_ms, t.lcp_ms, t.cls, t.tbt_ms, t.ttfb_ms,
            (select q.status_code from requests q
              where q.test_id = t.id and q.status_code > 0 and q.status_code not between 300 and 399
              order by q.start_ms, q.seq limit 1) as doc_status
       from tests t join locations l on l.id = t.location_id
      where t.public_id = $1`,
    [publicId],
  );
  const r = rows[0];
  if (!r) return null;
  const runRows = await pool().query(
    "select run_no, load_ms, page_bytes, request_count, is_median from test_runs where test_id = $1 order by run_no",
    [r.id],
  );
  return {
    runsDone: r.runs_done,
    runsPlanned: RUNS_PLANNED,
    runs: runRows.rows.map((x) => ({
      runNo: x.run_no,
      loadMs: x.load_ms,
      pageBytes: Number(x.page_bytes),
      requestCount: x.request_count,
      isMedian: x.is_median,
    })),
    publicId: r.public_id,
    url: r.url,
    locationSlug: r.location_slug,
    status: r.status,
    errorCode: (r.error_code ?? undefined) as ErrorCode | undefined,
    grade: r.grade ?? undefined,
    score: r.score ?? undefined,
    loadMs: r.load_ms ?? undefined,
    pageBytes: r.page_bytes === null ? undefined : Number(r.page_bytes),
    requestCount: r.request_count ?? undefined,
    docStatus: r.doc_status ?? undefined,
    fcpMs: r.fcp_ms ?? undefined,
    lcpMs: r.lcp_ms ?? undefined,
    cls: r.cls === null || r.cls === undefined ? undefined : Number(r.cls),
    tbtMs: r.tbt_ms ?? undefined,
    ttfbMs: r.ttfb_ms ?? undefined,
    idleMs: r.idle_ms ?? undefined,
    idleReached: r.idle_reached ?? undefined,
    createdAt: r.created_at.toISOString(),
    startedAt: r.started_at?.toISOString(),
    finishedAt: r.finished_at?.toISOString(),
    simulated: false,
  };
}

export async function getRequests(publicId: string): Promise<RequestRow[]> {
  const { rows } = await pool().query(
    `select r.seq, r.url, r.domain, r.content_type, r.status_code, r.size_bytes, r.start_ms,
            r.blocked_ms, r.dns_ms, r.connect_ms, r.ssl_ms, r.send_ms, r.wait_ms, r.receive_ms,
            r.is_redirect, r.cacheable, r.protocol,
            r.res_headers->>'content-encoding' as content_encoding,
            r.res_headers->>'cache-control' as cache_control,
            (r.res_headers ? 'strict-transport-security') as hsts,
            (r.res_headers ? 'content-security-policy') as csp,
            (r.res_headers ? 'x-content-type-options') as no_sniff
       from requests r join tests t on t.id = r.test_id
      where t.public_id = $1 order by r.start_ms, r.seq`,
    [publicId],
  );
  return rows.map((r) => ({
    seq: r.seq,
    url: r.url,
    domain: r.domain,
    contentType: r.content_type as ContentType,
    statusCode: r.status_code ?? 0,
    sizeBytes: Number(r.size_bytes ?? 0),
    startMs: r.start_ms,
    blockedMs: r.blocked_ms ?? 0,
    dnsMs: r.dns_ms ?? 0,
    connectMs: r.connect_ms ?? 0,
    sslMs: r.ssl_ms ?? 0,
    sendMs: r.send_ms ?? 0,
    waitMs: r.wait_ms ?? 0,
    receiveMs: r.receive_ms ?? 0,
    isRedirect: r.is_redirect ?? false,
    cacheable: r.cacheable,
    protocol: r.protocol ?? null,
    contentEncoding: r.content_encoding ?? "",
    cacheControl: r.cache_control ?? "",
    hsts: r.hsts ?? false,
    csp: r.csp ?? false,
    noSniff: r.no_sniff ?? false,
  }));
}

export async function getRules(publicId: string): Promise<RuleResult[]> {
  const { rows } = await pool().query(
    `select rr.rule_key, rr.score, rr.advice, rr.name
       from rule_results rr join tests t on t.id = rr.test_id
      where t.public_id = $1 order by rr.score, rr.rule_key`,
    [publicId],
  );
  return rows.map((r) => ({ key: r.rule_key, name: r.name, score: r.score, advice: r.advice ?? "" }));
}

/** The loading filmstrip frames for a test, oldest first. Empty for tests without frames. */
export async function getFrames(publicId: string): Promise<TestFrame[]> {
  const { rows } = await pool().query(
    `select f.at_ms, f.image
       from test_frames f join tests t on t.id = f.test_id
      where t.public_id = $1 order by f.at_ms`,
    [publicId],
  );
  return rows.map((r) => ({ atMs: r.at_ms, image: r.image }));
}

/** Past tests of the same URL and location (including this one), oldest first, for the trend chart.
 *  Only scored, finished tests count. Returns [] when this is the only one. */
export async function getHistory(publicId: string, limit = 12): Promise<HistoryPoint[]> {
  const { rows } = await pool().query(
    `select t.public_id, t.score, t.load_ms, t.created_at
       from tests t
       join tests cur on cur.public_id = $1
      where t.url = cur.url and t.location_id = cur.location_id
        and t.status = 'done' and t.score is not null and t.load_ms is not null
      order by t.created_at desc
      limit $2`,
    [publicId, limit],
  );
  if (rows.length < 2) return [];
  return rows
    .map((r) => ({
      publicId: r.public_id,
      score: r.score,
      loadMs: r.load_ms,
      createdAt: r.created_at.toISOString(),
      current: r.public_id === publicId,
    }))
    .reverse();
}

/** How many tests are waiting and how many are being measured right now. */
export async function queueStats(): Promise<{ queued: number; running: number }> {
  const { rows } = await pool().query(
    `select count(*) filter (where status = 'queued')::int as queued,
            count(*) filter (where status = 'running')::int as running
       from tests where status in ('queued','running')`,
  );
  return rows[0];
}

/** True when starting `adding` more tests would put this client over the limit in the last 10 minutes. */
export async function rateLimited(ipHash: string, adding = 1): Promise<boolean> {
  const { rows } = await pool().query(
    "select count(*)::int as n from tests where client_ip_hash = $1 and created_at > now() - interval '10 minutes'",
    [ipHash],
  );
  return rows[0].n + adding > rateLimit();
}

export async function createTest(url: string, locationSlug: string, ipHash: string): Promise<TestRow> {
  const publicId = randomBytes(7).toString("base64url");
  const client = await pool().connect();
  try {
    await client.query("begin");
    const loc = await client.query("select id from locations where slug = $1 and active", [locationSlug]);
    if (!loc.rows[0]) throw new Error("invalid_location");
    const t = await client.query(
      "insert into tests (public_id, url, location_id, client_ip_hash) values ($1, $2, $3, $4) returning id",
      [publicId, url, loc.rows[0].id, ipHash],
    );
    await client.query("insert into jobs (test_id, location_id) values ($1, $2)", [t.rows[0].id, loc.rows[0].id]);
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
  return (await getTest(publicId))!;
}
