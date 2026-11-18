// Nota de desempenho — mesma lógica do projeto web (src/lib/grading.ts), em JavaScript.
"use strict";

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

/** 100 até `full`, 0 a partir de `zero`, uma reta no meio. */
function ramp(value, full, zero) {
  if (value <= full) return 100;
  if (value >= zero) return 0;
  return clamp((100 * (zero - value)) / (zero - full));
}

const LIMITS = {
  loadMs: { full: 2000, zero: 10000 },
  pageMB: { full: 1.5, zero: 12 },
  requests: { full: 50, zero: 300 },
  imageMB: { full: 1, zero: 8 },
  scripts: { full: 15, zero: 80 },
  domains: { full: 10, zero: 40 },
};

const WEIGHTS = { load_time: 3, page_weight: 2, request_count: 1, image_weight: 1, blocking_scripts: 1, domains: 1 };

function featuresOf(requests, loadMs, pageBytes) {
  return {
    loadMs,
    pageBytes,
    count: requests.length,
    imageBytes: requests.filter((r) => r.contentType === "image").reduce((s, r) => s + r.sizeBytes, 0),
    scripts: requests.filter((r) => r.contentType === "js").length,
    domains: new Set(requests.map((r) => r.domain)).size,
  };
}

function scoreFeatures(f) {
  const MB = 1024 * 1024;
  const L = LIMITS;
  return [
    { key: "load_time", name: "Tempo de carregamento", score: ramp(f.loadMs, L.loadMs.full, L.loadMs.zero),
      advice: `Carregou em ${(f.loadMs / 1000).toFixed(2)} s. Meta: menos de ${L.loadMs.full / 1000} s.` },
    { key: "page_weight", name: "Peso total da página", score: ramp(f.pageBytes / MB, L.pageMB.full, L.pageMB.zero),
      advice: `A página pesa ${(f.pageBytes / MB).toFixed(2)} MB. Meta: até ${L.pageMB.full} MB. Comprima e reduza os maiores arquivos.` },
    { key: "request_count", name: "Poucas requisições", score: ramp(f.count, L.requests.full, L.requests.zero),
      advice: `A página faz ${f.count} requisições. Meta: até ${L.requests.full}. Junte arquivos e remova o que não é usado.` },
    { key: "image_weight", name: "Imagens leves", score: ramp(f.imageBytes / MB, L.imageMB.full, L.imageMB.zero),
      advice: `As imagens pesam ${(f.imageBytes / MB).toFixed(2)} MB. Meta: até ${L.imageMB.full} MB. Use formatos modernos (WebP, AVIF) e dimensões adequadas.` },
    { key: "blocking_scripts", name: "Scripts sob controle", score: ramp(f.scripts, L.scripts.full, L.scripts.zero),
      advice: `${f.scripts} scripts carregados. Meta: até ${L.scripts.full}. Adie ou remova os que não são essenciais.` },
    { key: "domains", name: "Poucos domínios", score: ramp(f.domains, L.domains.full, L.domains.zero),
      advice: `${f.domains} domínios diferentes. Meta: até ${L.domains.full}. Cada um custa uma conexão nova.` },
  ];
}

function evaluateRules(requests, loadMs, pageBytes) {
  return scoreFeatures(featuresOf(requests, loadMs, pageBytes));
}

function gradeFromRules(rules) {
  let sum = 0, weights = 0;
  for (const r of rules) {
    const w = WEIGHTS[r.key] ?? 1;
    sum += r.score * w;
    weights += w;
  }
  const score = Math.round(sum / weights);
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : score >= 50 ? "E" : "F";
  return { score, grade };
}

module.exports = { ramp, LIMITS, WEIGHTS, featuresOf, scoreFeatures, evaluateRules, gradeFromRules };
