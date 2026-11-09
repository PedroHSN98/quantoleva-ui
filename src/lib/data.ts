// FAKE data layer for the vertical slice: in-memory, with a SIMULATED runner.
// Same function signatures the real (Postgres + Playwright worker) layer will expose,
// so swapping it in changes no screen code. Results here are NOT real measurements.
import { evaluateRules, gradeFromRules } from "./grading";
import type { ContentType, Location, RequestRow, RuleResult, TestRow } from "./types";

interface Store {
  tests: Map<string, TestRow>;
  requests: Map<string, RequestRow[]>;
  rules: Map<string, RuleResult[]>;
  hits: Map<string, number[]>;
}

const g = globalThis as unknown as { __store?: Store };
const store: Store = (g.__store ??= { tests: new Map(), requests: new Map(), rules: new Map(), hits: new Map() });

const LOCATIONS: Location[] = [
  { slug: "sa-east", name: "São Paulo", region: "América do Sul" },
  { slug: "us-east", name: "Virgínia", region: "América do Norte" },
  { slug: "eu-west", name: "Frankfurt", region: "Europa" },
];

export async function listLocations(): Promise<Location[]> {
  return LOCATIONS;
}

export async function getTest(publicId: string): Promise<TestRow | null> {
  return store.tests.get(publicId) ?? null;
}

export async function getRequests(publicId: string): Promise<RequestRow[]> {
  return store.requests.get(publicId) ?? [];
}

export async function getRules(publicId: string): Promise<RuleResult[]> {
  return store.rules.get(publicId) ?? [];
}

/** Returns true when the caller is over the limit (5 tests per 10 minutes). */
export function rateLimited(clientKey: string): boolean {
  const now = Date.now();
  const recent = (store.hits.get(clientKey) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 5) {
    store.hits.set(clientKey, recent);
    return true;
  }
  recent.push(now);
  store.hits.set(clientKey, recent);
  return false;
}

export async function createTest(url: string, locationSlug: string): Promise<TestRow> {
  const publicId = Math.random().toString(36).slice(2, 10);
  const row: TestRow = {
    publicId, url, locationSlug, status: "queued",
    createdAt: new Date().toISOString(), simulated: true,
  };
  store.tests.set(publicId, row);
  setTimeout(() => update(publicId, { status: "running" }), 800);
  setTimeout(() => finish(publicId), 3200);
  return row;
}

function update(id: string, patch: Partial<TestRow>) {
  const t = store.tests.get(id);
  if (t) store.tests.set(id, { ...t, ...patch });
}

function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function finish(id: string) {
  const t = store.tests.get(id);
  if (!t) return;
  const host = new URL(t.url).hostname;
  let seed = 7;
  for (const c of t.url) seed = (Math.imul(seed, 31) + c.charCodeAt(0)) >>> 0;
  const rnd = seeded(seed);

  const kinds: ContentType[] = ["html", "js", "js", "css", "image", "image", "image", "font", "text", "other"];
  const domains = [host, `cdn.${host}`, "fonts.example-cdn.net", "stats.example-analytics.net"];
  const n = 12 + Math.floor(rnd() * 30);
  const requests: RequestRow[] = [];
  let cursor = 0;
  for (let i = 0; i < n; i++) {
    const contentType: ContentType = i === 0 ? "html" : kinds[Math.floor(rnd() * kinds.length)];
    const blocked = Math.round(rnd() * 20);
    const dns = i < 4 ? Math.round(10 + rnd() * 40) : 0;
    const connect = i < 4 ? Math.round(15 + rnd() * 50) : 0;
    const ssl = i < 4 ? Math.round(20 + rnd() * 60) : 0;
    const send = 1 + Math.round(rnd() * 3);
    const wait = Math.round(30 + rnd() * 250);
    const receive = Math.round(5 + rnd() * 200);
    const size = Math.round((contentType === "image" ? 20_000 + rnd() * 400_000 : 2_000 + rnd() * 150_000));
    requests.push({
      seq: i,
      url: `https://${domains[i === 0 ? 0 : Math.floor(rnd() * domains.length)]}/${contentType === "html" ? "" : `assets/file-${i}.${contentType === "js" ? "js" : contentType === "css" ? "css" : contentType === "image" ? "jpg" : contentType === "font" ? "woff2" : "txt"}`}`,
      domain: domains[i === 0 ? 0 : Math.floor(rnd() * domains.length)],
      contentType,
      statusCode: rnd() < 0.04 ? 404 : rnd() < 0.06 ? 301 : 200,
      sizeBytes: size,
      startMs: cursor,
      blockedMs: blocked, dnsMs: dns, connectMs: connect, sslMs: ssl,
      sendMs: send, waitMs: wait, receiveMs: receive,
    });
    cursor += Math.round(rnd() * 90);
  }
  const loadMs = Math.max(...requests.map((r) => r.startMs + r.blockedMs + r.dnsMs + r.connectMs + r.sslMs + r.sendMs + r.waitMs + r.receiveMs));
  const pageBytes = requests.reduce((s, r) => s + r.sizeBytes, 0);
  const rules = evaluateRules(requests, loadMs, pageBytes);
  const { score, grade } = gradeFromRules(rules);

  store.requests.set(id, requests);
  store.rules.set(id, rules);
  update(id, {
    status: "done", loadMs, pageBytes, requestCount: requests.length,
    score, grade, finishedAt: new Date().toISOString(),
  });
}
