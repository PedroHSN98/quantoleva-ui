import type { RunSummary } from "./median";

export const RUNS_PLANNED = 1;

export type TestStatus = "queued" | "running" | "done" | "failed";
export type ErrorCode = "invalid_url" | "blocked_target" | "unreachable" | "timeout" | "internal";
export type ContentType = "html" | "js" | "css" | "image" | "text" | "font" | "other";

export interface Location {
  slug: string;
  name: string;
  region: string;
}

export interface TestRow {
  publicId: string;
  url: string;
  locationSlug: string;
  status: TestStatus;
  errorCode?: ErrorCode;
  grade?: "A" | "B" | "C" | "D" | "E" | "F";
  score?: number;
  loadMs?: number;
  pageBytes?: number;
  requestCount?: number;
  /** ms from the start until the page stopped downloading files; undefined for tests made before this was measured */
  idleMs?: number;
  /** false: the network was still busy when we stopped waiting, so idleMs is "more than" */
  idleReached?: boolean;
  /** HTTP status of the main page (first response that is not a redirect). Undefined if unknown. */
  docStatus?: number;
  /** Core Web Vitals (median run); undefined for tests measured before they were captured */
  fcpMs?: number;
  lcpMs?: number;
  cls?: number;
  tbtMs?: number;
  ttfbMs?: number;
  /** how many of the planned runs have finished (progress while running) */
  runsDone: number;
  runsPlanned: number;
  /** every finished run, with the median one flagged. Empty for tests made before runs existed. */
  runs: RunSummary[];
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  /** true while the data layer is the fake in-memory one */
  simulated: boolean;
}

export interface RequestRow {
  seq: number;
  url: string;
  domain: string;
  contentType: ContentType;
  statusCode: number;
  sizeBytes: number;
  startMs: number;
  blockedMs: number;
  dnsMs: number;
  connectMs: number;
  sslMs: number;
  sendMs: number;
  waitMs: number;
  receiveMs: number;
  /** Fields below power the diagnostics. Undefined for tests measured before they were stored. */
  isRedirect?: boolean;
  /** whether the response may be reused from cache; null when it couldn't be decided */
  cacheable?: boolean | null;
  /** network protocol, e.g. "h2", "h3", "http/1.1" */
  protocol?: string | null;
  /** value of the content-encoding response header, e.g. "gzip", "br"; "" when absent */
  contentEncoding?: string;
  /** value of the cache-control response header; "" when absent */
  cacheControl?: string;
  /** security response headers (meaningful on the main document) */
  hsts?: boolean;
  csp?: boolean;
  noSniff?: boolean;
}

export interface RuleResult {
  key: string;
  name: string;
  score: number;
  advice: string;
}

/** One filmstrip frame: a data: URL and the moment it was captured. */
export interface TestFrame {
  atMs: number;
  image: string;
}

/** One past test of the same URL+location, for the "Evolução" chart. Chronological order. */
export interface HistoryPoint {
  publicId: string;
  score: number;
  loadMs: number;
  createdAt: string;
  /** true for the test currently being viewed */
  current: boolean;
}
