// Um teste completo: mede a página e calcula a nota. É o que o main process chama.
"use strict";

const { measure, MeasureError } = require("./measure");
const { evaluateRules, gradeFromRules } = require("./grading");

/** Aceita "exemplo.com" e vira "https://exemplo.com"; mantém http:// e https:// como vieram. */
function normalizeUrl(input) {
  const s = String(input).trim();
  if (!s) throw new MeasureError("invalid_url");
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    throw new MeasureError("invalid_url");
  }
}

async function runTest(input) {
  const url = normalizeUrl(input);
  const m = await measure(url);
  const pageBytes = m.requests.reduce((s, r) => s + r.sizeBytes, 0);
  const rules = evaluateRules(m.requests, m.loadMs, pageBytes);
  const { score, grade } = gradeFromRules(rules);
  return {
    url,
    finalUrl: m.finalUrl,
    loadMs: m.loadMs,
    idleMs: m.idleMs,
    idleReached: m.idleReached,
    pageBytes,
    requestCount: m.requests.length,
    score,
    grade,
    rules,
    requests: m.requests,
    vitals: m.vitals,
    frames: m.frames,
    measuredAt: new Date().toISOString(),
  };
}

module.exports = { runTest, normalizeUrl, MeasureError };
