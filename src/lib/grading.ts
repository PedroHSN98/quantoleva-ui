import type { RequestRow, RuleResult, TestRow } from "./types";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** 100 up to `full`, 0 from `zero` on, a straight line in between. */
export function ramp(value: number, full: number, zero: number): number {
  if (value <= full) return 100;
  if (value >= zero) return 0;
  return clamp((100 * (zero - value)) / (zero - full));
}

/**
 * Limits, calibrated on 15 real public sites measured by this app on 2026-11-09 (see replica/score-analysis.md).
 * Those sites had a median of about 4.5 MB and 130 requests when measured cold, so a typical site lands around C,
 * a lean one gets A, and only pages far heavier than the usual get F.
 */
export const LIMITS = {
  loadMs: { full: 2_000, zero: 10_000 },
  pageMB: { full: 1.5, zero: 12 },
  requests: { full: 50, zero: 300 },
  imageMB: { full: 1, zero: 8 },
  scripts: { full: 15, zero: 80 },
  domains: { full: 10, zero: 40 },
} as const;

/** How much each rule counts in the final score. Time counts most; the size rules overlap, so they count less. */
export const WEIGHTS: Record<string, number> = {
  load_time: 3,
  page_weight: 2,
  request_count: 1,
  image_weight: 1,
  blocking_scripts: 1,
  domains: 1,
};

export type Features = { loadMs: number; pageBytes: number; count: number; imageBytes: number; scripts: number; domains: number };

export function featuresOf(requests: RequestRow[], loadMs: number, pageBytes: number): Features {
  return {
    loadMs,
    pageBytes,
    count: requests.length,
    imageBytes: requests.filter((r) => r.contentType === "image").reduce((s, r) => s + r.sizeBytes, 0),
    scripts: requests.filter((r) => r.contentType === "js").length,
    domains: new Set(requests.map((r) => r.domain)).size,
  };
}

/** Original rule set (not any other tool's formula). Each rule 0-100. */
export function scoreFeatures(f: Features): RuleResult[] {
  const MB = 1024 * 1024;
  const L = LIMITS;
  return [
    {
      key: "load_time",
      name: "Tempo de carregamento",
      score: ramp(f.loadMs, L.loadMs.full, L.loadMs.zero),
      advice: `Carregou em ${(f.loadMs / 1000).toFixed(2)} s. Meta: menos de ${L.loadMs.full / 1000} s.`,
    },
    {
      key: "page_weight",
      name: "Peso total da página",
      score: ramp(f.pageBytes / MB, L.pageMB.full, L.pageMB.zero),
      advice: `A página pesa ${(f.pageBytes / MB).toFixed(2)} MB. Meta: até ${L.pageMB.full} MB. Comprima e reduza os maiores arquivos.`,
    },
    {
      key: "request_count",
      name: "Poucas requisições",
      score: ramp(f.count, L.requests.full, L.requests.zero),
      advice: `A página faz ${f.count} requisições. Meta: até ${L.requests.full}. Junte arquivos e remova o que não é usado.`,
    },
    {
      key: "image_weight",
      name: "Imagens leves",
      score: ramp(f.imageBytes / MB, L.imageMB.full, L.imageMB.zero),
      advice: `As imagens pesam ${(f.imageBytes / MB).toFixed(2)} MB. Meta: até ${L.imageMB.full} MB. Use formatos modernos (WebP, AVIF) e dimensões adequadas.`,
    },
    {
      key: "blocking_scripts",
      name: "Scripts sob controle",
      score: ramp(f.scripts, L.scripts.full, L.scripts.zero),
      advice: `${f.scripts} scripts carregados. Meta: até ${L.scripts.full}. Adie ou remova os que não são essenciais.`,
    },
    {
      key: "domains",
      name: "Poucos domínios",
      score: ramp(f.domains, L.domains.full, L.domains.zero),
      advice: `${f.domains} domínios diferentes. Meta: até ${L.domains.full}. Cada um custa uma conexão nova.`,
    },
  ];
}

export function evaluateRules(requests: RequestRow[], loadMs: number, pageBytes: number): RuleResult[] {
  return scoreFeatures(featuresOf(requests, loadMs, pageBytes));
}

export function gradeFromRules(rules: RuleResult[]): { score: number; grade: NonNullable<TestRow["grade"]> } {
  let sum = 0;
  let weights = 0;
  for (const r of rules) {
    const w = WEIGHTS[r.key] ?? 1;
    sum += r.score * w;
    weights += w;
  }
  const score = Math.round(sum / weights);
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : score >= 50 ? "E" : "F";
  return { score, grade };
}
