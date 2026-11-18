// Mede uma página num Chromium real, via CDP — mesma lógica do worker web (worker/measure.ts),
// em JavaScript e sem a proteção de rede (num app local, você pode medir até localhost).
"use strict";

const { chromium } = require("playwright");

const SENSITIVE = new Set(["cookie", "set-cookie", "authorization", "proxy-authorization"]);
const MAX_REQUESTS = 500;
const NAV_TIMEOUT_MS = 120000;

class MeasureError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function clean(h) {
  const out = {};
  for (const [k, v] of Object.entries(h ?? {})) if (!SENSITIVE.has(k.toLowerCase())) out[k.toLowerCase()] = String(v).slice(0, 500);
  return out;
}

function classify(type, mime) {
  if (type === "Document") return "html";
  if (type === "Script") return "js";
  if (type === "Stylesheet") return "css";
  if (type === "Image") return "image";
  if (type === "Font") return "font";
  if (mime.startsWith("text/")) return "text";
  return "other";
}

const MAX_KEPT_FRAMES = 8;

/** Drop consecutive identical frames, then keep up to 8 evenly spaced across the load. */
function pickFrames(raw) {
  const changed = raw.filter((f, i) => i === 0 || f.data !== raw[i - 1].data);
  if (changed.length <= MAX_KEPT_FRAMES) {
    return changed.map((f) => ({ atMs: f.atMs, image: `data:image/jpeg;base64,${f.data}` }));
  }
  const out = [];
  for (let i = 0; i < MAX_KEPT_FRAMES; i++) {
    const f = changed[Math.round((i / (MAX_KEPT_FRAMES - 1)) * (changed.length - 1))];
    out.push({ atMs: f.atMs, image: `data:image/jpeg;base64,${f.data}` });
  }
  return out;
}

function cacheable(h) {
  const cc = h["cache-control"]?.toLowerCase();
  if (cc) return !/no-store|no-cache|max-age=0/.test(cc);
  if (h["expires"] || h["etag"] || h["last-modified"]) return true;
  return null;
}

async function measure(url, timeoutMs = NAV_TIMEOUT_MS) {
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

    // Core Web Vitals: set up observers before anything loads; read them after load, draining
    // any pending entries synchronously so an async callback never costs us the value.
    await page.addInitScript(() => {
      window.__vobs = ["largest-contentful-paint", "layout-shift", "longtask"].map((type) => {
        const list = [];
        let obs = null;
        try {
          obs = new PerformanceObserver((l) => { for (const e of l.getEntries()) list.push(e); });
          obs.observe({ type, buffered: true });
        } catch (_) { /* unsupported type */ }
        return { type, obs, entries: list };
      });
    });

    // Loading filmstrip: collect downscaled JPEG frames while the page renders.
    const rawFrames = [];
    let screencastStart = 0;
    const MAX_FRAMES = 300;
    cdp.on("Page.screencastFrame", async (e) => {
      if (rawFrames.length < MAX_FRAMES && screencastStart) rawFrames.push({ atMs: Date.now() - screencastStart, data: e.data });
      try { await cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId }); } catch (_) { /* page gone */ }
    });

    const entries = new Map();
    const done = [];
    let t0 = 0;

    cdp.on("Network.requestWillBeSent", (e) => {
      if (e.request.url.startsWith("data:") || e.request.url.startsWith("blob:")) return;
      if (!t0) t0 = e.timestamp;
      const prev = entries.get(e.requestId);
      if (e.redirectResponse && prev) {
        prev.status = e.redirectResponse.status;
        prev.timing = e.redirectResponse.timing;
        prev.resHeaders = clean(e.redirectResponse.headers);
        prev.protocol = e.redirectResponse.protocol ?? null;
        prev.endTs = e.timestamp;
        prev.isRedirect = true;
        done.push(prev);
      }
      if (done.length + entries.size >= MAX_REQUESTS) return;
      entries.set(e.requestId, {
        id: e.requestId, url: e.request.url, type: e.type ?? "Other", mime: "", startTs: e.timestamp,
        status: 0, size: 0, isRedirect: false, protocol: null, reqHeaders: clean(e.request.headers), resHeaders: {},
      });
    });
    cdp.on("Network.responseReceived", (e) => {
      const en = entries.get(e.requestId);
      if (!en) return;
      en.status = e.response.status;
      en.mime = e.response.mimeType ?? "";
      en.timing = e.response.timing;
      en.resHeaders = clean(e.response.headers);
      en.protocol = e.response.protocol ?? null;
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

    await cdp.send("Page.enable");
    await cdp.send("Page.startScreencast", { format: "jpeg", quality: 50, maxWidth: 400, maxHeight: 300, everyNthFrame: 1 }).catch(() => { /* screencast optional */ });
    screencastStart = Date.now();
    const started = screencastStart;
    try {
      await page.goto(url, { waitUntil: "load", timeout: timeoutMs });
    } catch (e) {
      const msg = e.message ?? "";
      if (e.name === "TimeoutError") throw new MeasureError("timeout");
      if (/ERR_NAME_NOT_RESOLVED|ERR_CONNECTION|ERR_CERT|ERR_SSL|ERR_ADDRESS|ERR_TUNNEL/.test(msg)) throw new MeasureError("unreachable");
      throw new MeasureError("unreachable");
    }
    const loadMs = Date.now() - started;
    let idleReached = true;
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => { idleReached = false; });
    const idleMs = Math.max(loadMs, Date.now() - started);
    for (const en of entries.values()) done.push(en);

    await cdp.send("Page.stopScreencast").catch(() => { /* already stopped */ });

    // Read the Core Web Vitals the observers collected. Best-effort: a null field just hides a tile.
    const vitals = await page.evaluate(() => {
      const paints = performance.getEntriesByType("paint");
      const fcp = (paints.find((p) => p.name === "first-contentful-paint") || {}).startTime || 0;
      const nav = performance.getEntriesByType("navigation")[0];
      const ttfb = nav ? nav.responseStart : 0;
      let lcp = 0, cls = 0, tbt = 0, hasLcp = false, hasCls = false;
      for (const v of window.__vobs || []) {
        const all = v.entries.concat(v.obs ? v.obs.takeRecords() : []);
        if (v.type === "largest-contentful-paint") { for (const e of all) { lcp = Math.max(lcp, e.startTime); hasLcp = true; } }
        else if (v.type === "layout-shift") { hasCls = true; for (const e of all) { if (!e.hadRecentInput) cls += e.value; } }
        else if (v.type === "longtask") { for (const e of all) if (e.startTime + e.duration > fcp) tbt += Math.max(0, e.duration - 50); }
      }
      return {
        fcpMs: fcp ? Math.round(fcp) : null,
        lcpMs: hasLcp && lcp ? Math.round(lcp) : null,
        cls: hasCls ? Math.round(cls * 1000) / 1000 : null,
        tbtMs: Math.round(tbt),
        ttfbMs: ttfb ? Math.round(ttfb) : null,
      };
    }).catch(() => ({ fcpMs: null, lcpMs: null, cls: null, tbtMs: null, ttfbMs: null }));

    const frames = pickFrames(rawFrames);

    const finalUrl = page.url();
    done.sort((a, b) => a.startTs - b.startTs);

    const ms = (n) => Math.max(0, Math.round(n));
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
      const h = en.resHeaders || {};
      return {
        seq: i, url: en.url.slice(0, 2000), domain: u.hostname,
        contentType: classify(en.type, en.mime), statusCode: en.status, sizeBytes: Math.round(en.size),
        startMs, blockedMs, dnsMs, connectMs, sslMs, sendMs, waitMs, receiveMs,
        isRedirect: en.isRedirect, cacheable: cacheable(en.resHeaders), protocol: en.protocol ?? null,
        contentEncoding: h["content-encoding"] || "", cacheControl: h["cache-control"] || "",
        hsts: "strict-transport-security" in h, csp: "content-security-policy" in h, noSniff: "x-content-type-options" in h,
      };
    });
    return { finalUrl, loadMs, idleMs, idleReached, vitals, frames, requests };
  } finally {
    await browser.close();
  }
}

module.exports = { measure, MeasureError, NAV_TIMEOUT_MS };
