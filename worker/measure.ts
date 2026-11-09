import { chromium } from "playwright";
import { assertPublicHost } from "../src/lib/ssrf";
import type { ContentType, ErrorCode, RequestRow } from "../src/lib/types";

const SENSITIVE = new Set(["cookie", "set-cookie", "authorization", "proxy-authorization"]);
const MAX_REQUESTS = 500;
// Slow pages can take well over a minute. Keep the test running up to 5 minutes before giving up.
// worker/index.ts treats a lock as stale only after 8 minutes, keep this below that.
const NAV_TIMEOUT_MS = 300_000;

export class MeasureError extends Error {
  constructor(public code: ErrorCode) {
    super(code);
  }
}

export interface Measured {
  finalUrl: string;
  loadMs: number;
  requests: (RequestRow & { isRedirect: boolean; cacheable: boolean | null; reqHeaders: Record<string, string>; resHeaders: Record<string, string> })[];
}

interface Entry {
  id: string;
  url: string;
  type: string;
  mime: string;
  startTs: number;
  status: number;
  timing?: { requestTime: number; dnsStart: number; dnsEnd: number; connectStart: number; connectEnd: number; sslStart: number; sslEnd: number; sendStart: number; sendEnd: number; receiveHeadersEnd: number };
  endTs?: number;
  size: number;
  isRedirect: boolean;
  reqHeaders: Record<string, string>;
  resHeaders: Record<string, string>;
}

function clean(h: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h ?? {})) if (!SENSITIVE.has(k.toLowerCase())) out[k.toLowerCase()] = String(v).slice(0, 500);
  return out;
}

function classify(type: string, mime: string): ContentType {
  if (type === "Document") return "html";
  if (type === "Script") return "js";
  if (type === "Stylesheet") return "css";
  if (type === "Image") return "image";
  if (type === "Font") return "font";
  if (mime.startsWith("text/")) return "text";
  return "other";
}

function cacheable(h: Record<string, string>): boolean | null {
  const cc = h["cache-control"]?.toLowerCase();
  if (cc) return !/no-store|no-cache|max-age=0/.test(cc);
  if (h["expires"] || h["etag"] || h["last-modified"]) return true;
  return null;
}

export async function measure(url: string): Promise<Measured> {
  try {
    await assertPublicHost(new URL(url).hostname);
  } catch (e) {
    throw new MeasureError((e as Error).message === "blocked_target" ? "blocked_target" : "unreachable");
  }

  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
    let blocked = false;
    // SSRF guard on every request the page makes (including redirects).
    await context.route("**/*", async (route) => {
      const u = new URL(route.request().url());
      if (u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      try {
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("blocked_target");
        await assertPublicHost(u.hostname);
        return route.continue();
      } catch {
        blocked = true;
        return route.abort("blockedbyclient");
      }
    });

    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

    const entries = new Map<string, Entry>();
    const done: Entry[] = [];
    let t0 = 0;

    cdp.on("Network.requestWillBeSent", (e) => {
      if (e.request.url.startsWith("data:") || e.request.url.startsWith("blob:")) return;
      if (!t0) t0 = e.timestamp;
      const prev = entries.get(e.requestId);
      if (e.redirectResponse && prev) {
        prev.status = e.redirectResponse.status;
        prev.timing = e.redirectResponse.timing;
        prev.resHeaders = clean(e.redirectResponse.headers);
        prev.endTs = e.timestamp;
        prev.isRedirect = true;
        done.push(prev);
      }
      if (done.length + entries.size >= MAX_REQUESTS) return;
      entries.set(e.requestId, {
        id: e.requestId, url: e.request.url, type: e.type ?? "Other", mime: "", startTs: e.timestamp,
        status: 0, size: 0, isRedirect: false, reqHeaders: clean(e.request.headers), resHeaders: {},
      });
    });
    cdp.on("Network.responseReceived", (e) => {
      const en = entries.get(e.requestId);
      if (!en) return;
      en.status = e.response.status;
      en.mime = e.response.mimeType ?? "";
      en.timing = e.response.timing;
      en.resHeaders = clean(e.response.headers);
      en.type = e.type ?? en.type;
    });
    cdp.on("Network.loadingFinished", (e) => {
      const en = entries.get(e.requestId);
      if (!en) return;
      en.endTs = e.timestamp;
      en.size = e.encodedDataLength;
      done.push(en);
      entries.delete(e.requestId);
    });
    cdp.on("Network.loadingFailed", (e) => {
      const en = entries.get(e.requestId);
      if (!en) return;
      en.endTs = e.timestamp;
      done.push(en);
      entries.delete(e.requestId);
    });

    const started = Date.now();
    try {
      await page.goto(url, { waitUntil: "load", timeout: NAV_TIMEOUT_MS });
    } catch (e) {
      if (blocked) throw new MeasureError("blocked_target");
      const msg = (e as Error).message;
      if ((e as Error).name === "TimeoutError") throw new MeasureError("timeout");
      if (/ERR_NAME_NOT_RESOLVED|ERR_CONNECTION|ERR_CERT|ERR_SSL|ERR_ADDRESS|ERR_TUNNEL/.test(msg)) throw new MeasureError("unreachable");
      throw new MeasureError("unreachable");
    }
    const loadMs = Date.now() - started;
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    for (const en of entries.values()) done.push(en); // anything still open

    const finalUrl = page.url();
    done.sort((a, b) => a.startTs - b.startTs);

    const ms = (n: number) => Math.max(0, Math.round(n));
    const requests = done.map((en, i) => {
      const t = en.timing;
      const startMs = ms((en.startTs - t0) * 1000);
      const total = en.endTs ? ms((en.endTs - en.startTs) * 1000) : 0;
      let blockedMs = 0, dnsMs = 0, connectMs = 0, sslMs = 0, sendMs = 0, waitMs = 0, receiveMs = 0;
      if (t) {
        const first = [t.dnsStart, t.connectStart, t.sendStart].find((x) => x >= 0) ?? 0;
        blockedMs = ms(first);
        if (t.dnsStart >= 0 && t.dnsEnd >= 0) dnsMs = ms(t.dnsEnd - t.dnsStart);
        if (t.sslStart >= 0 && t.sslEnd >= 0) sslMs = ms(t.sslEnd - t.sslStart);
        if (t.connectStart >= 0 && t.connectEnd >= 0) connectMs = ms(t.connectEnd - t.connectStart - sslMs);
        sendMs = ms(t.sendEnd - t.sendStart);
        waitMs = ms(t.receiveHeadersEnd - t.sendEnd);
        receiveMs = ms(total - t.receiveHeadersEnd - (t.requestTime - en.startTs) * 1000);
      } else {
        waitMs = total;
      }
      const u = new URL(en.url);
      return {
        seq: i, url: en.url.slice(0, 2000), domain: u.hostname,
        contentType: classify(en.type, en.mime), statusCode: en.status, sizeBytes: Math.round(en.size),
        startMs, blockedMs, dnsMs, connectMs, sslMs, sendMs, waitMs, receiveMs,
        isRedirect: en.isRedirect, cacheable: cacheable(en.resHeaders),
        reqHeaders: en.reqHeaders, resHeaders: en.resHeaders,
      };
    });
    return { finalUrl, loadMs, requests };
  } finally {
    await browser.close();
  }
}
