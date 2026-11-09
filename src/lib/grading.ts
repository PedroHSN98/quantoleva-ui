import type { RequestRow, RuleResult, TestRow } from "./types";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Original rule set (not any other tool's formula). Each rule 0-100. */
export function evaluateRules(requests: RequestRow[], loadMs: number, pageBytes: number): RuleResult[] {
  const count = requests.length;
  const imageBytes = requests.filter((r) => r.contentType === "image").reduce((s, r) => s + r.sizeBytes, 0);
  const scriptCount = requests.filter((r) => r.contentType === "js").length;
  const domains = new Set(requests.map((r) => r.domain)).size;

  return [
    {
      key: "request_count",
      name: "Poucas requisições",
      score: clamp(100 - Math.max(0, count - 30) * 2),
      advice: `A página faz ${count} requisições. Junte arquivos e remova o que não é usado.`,
    },
    {
      key: "page_weight",
      name: "Peso total da página",
      score: clamp(100 - Math.max(0, pageBytes / 1024 / 1024 - 1) * 25),
      advice: `A página pesa ${(pageBytes / 1024 / 1024).toFixed(2)} MB. Comprima e reduza os maiores arquivos.`,
    },
    {
      key: "image_weight",
      name: "Imagens leves",
      score: clamp(100 - Math.max(0, imageBytes / 1024 / 1024 - 0.5) * 40),
      advice: "Use formatos modernos (WebP, AVIF) e dimensões adequadas.",
    },
    {
      key: "blocking_scripts",
      name: "Scripts sob controle",
      score: clamp(100 - Math.max(0, scriptCount - 8) * 6),
      advice: `${scriptCount} scripts carregados. Adie ou remova os que não são essenciais.`,
    },
    {
      key: "load_time",
      name: "Tempo de carregamento",
      score: clamp(100 - Math.max(0, loadMs - 1000) / 40),
      advice: `Carregou em ${(loadMs / 1000).toFixed(2)} s. Meta: menos de 2 s.`,
    },
    {
      key: "domains",
      name: "Poucos domínios",
      score: clamp(100 - Math.max(0, domains - 6) * 8),
      advice: `${domains} domínios diferentes. Cada um custa uma conexão nova.`,
    },
  ];
}

export function gradeFromRules(rules: RuleResult[]): { score: number; grade: NonNullable<TestRow["grade"]> } {
  const score = Math.round(rules.reduce((s, r) => s + r.score, 0) / rules.length);
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : score >= 50 ? "E" : "F";
  return { score, grade };
}
