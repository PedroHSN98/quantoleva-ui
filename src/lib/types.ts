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
  createdAt: string;
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
}

export interface RuleResult {
  key: string;
  name: string;
  score: number;
  advice: string;
}
