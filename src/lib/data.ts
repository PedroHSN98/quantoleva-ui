// Postgres data layer. Same function signatures as the earlier fake layer, so no screen changed.
import { createHash, randomBytes } from "node:crypto";
import { pool } from "./db";
import type { ContentType, ErrorCode, Location, RequestRow, RuleResult, TestRow } from "./types";

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
            t.load_ms, t.page_bytes, t.request_count, t.created_at, t.finished_at
       from tests t join locations l on l.id = t.location_id
      where t.public_id = $1`,
    [publicId],
  );
  const r = rows[0];
  if (!r) return null;
  return {
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
    createdAt: r.created_at.toISOString(),
    finishedAt: r.finished_at?.toISOString(),
    simulated: false,
  };
}

export async function getRequests(publicId: string): Promise<RequestRow[]> {
  const { rows } = await pool().query(
    `select r.seq, r.url, r.domain, r.content_type, r.status_code, r.size_bytes, r.start_ms,
            r.blocked_ms, r.dns_ms, r.connect_ms, r.ssl_ms, r.send_ms, r.wait_ms, r.receive_ms
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

/** True when this client already started 5 tests in the last 10 minutes. */
export async function rateLimited(ipHash: string): Promise<boolean> {
  const { rows } = await pool().query(
    "select count(*)::int as n from tests where client_ip_hash = $1 and created_at > now() - interval '10 minutes'",
    [ipHash],
  );
  return rows[0].n >= Number(process.env.RATE_LIMIT_MAX ?? 5);
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
