// Builds the downloadable report. Plain text, no server: the screen already has all the data.
// Separator ";" and decimal comma, because that is what Excel in pt-BR expects. UTF-8 with BOM so accents survive.
import { blockNotice } from "./block-notice";
import type { RequestRow, RuleResult, TestRow } from "./types";

const SEP = ";";
const BOM = "﻿";

/** One CSV cell: always quoted; a leading = + - @ is neutralised so a spreadsheet never runs it as a formula. */
export function cell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s) && typeof value === "string") s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const row = (cells: Array<string | number | undefined | null>) => cells.map(cell).join(SEP);
const kb = (bytes: number) => (bytes / 1024).toFixed(2).replace(".", ",");
const mb = (bytes: number) => (bytes / 1048576).toFixed(2).replace(".", ",");

function phases(r: RequestRow) {
  return r.blockedMs + r.dnsMs + r.connectMs + r.sslMs + r.sendMs + r.waitMs + r.receiveMs;
}

/** Everything the result screen shows: summary, the rules with their tips, and every file with its sizes and timings. */
export function resultCsv(test: TestRow, rules: RuleResult[], requests: RequestRow[]): string {
  const notice = blockNotice(test.docStatus);
  const first = requests.find((r) => r.contentType === "html" && r.statusCode >= 200 && r.statusCode < 300) ?? requests[0];
  const lines: string[] = [];

  lines.push(row(["RESUMO"]));
  lines.push(row(["Endereço testado", test.url]));
  lines.push(row(["Local do teste", test.locationSlug]));
  lines.push(row(["Data", new Date(test.createdAt).toLocaleString("pt-BR")]));
  lines.push(row(["Nota", notice ? "sem nota" : test.grade]));
  lines.push(row(["Pontuação (0 a 100)", notice ? "" : test.score]));
  lines.push(row(["Tempo de carregamento (ms)", test.loadMs]));
  lines.push(row(["Tamanho da página (bytes)", test.pageBytes]));
  lines.push(row(["Tamanho da página (MB)", mb(test.pageBytes ?? 0)]));
  lines.push(row(["Requisições", test.requestCount]));
  if (first) lines.push(row(["Primeira resposta do servidor (ms)", first.dnsMs + first.connectMs + first.sslMs + first.sendMs + first.waitMs]));
  lines.push(row(["Status da página principal", test.docStatus]));
  if (notice) lines.push(row(["Aviso", `${notice.short}. ${notice.long}`]));
  lines.push("");

  if (!notice && rules.length > 0) {
    lines.push(row(["REGRAS DA NOTA"]));
    lines.push(row(["Regra", "Pontuação (0 a 100)", "Dica"]));
    for (const r of rules) lines.push(row([r.name, r.score, r.score < 90 ? r.advice : ""]));
    lines.push("");
  }

  lines.push(row(["ARQUIVOS PEDIDOS PELA PÁGINA"]));
  lines.push(row([
    "Nº", "Endereço do arquivo", "Domínio", "Tipo", "Status HTTP", "Tamanho (bytes)", "Tamanho (KB)",
    "Início (ms)", "Bloqueio (ms)", "DNS (ms)", "Conexão (ms)", "SSL (ms)", "Envio (ms)", "Espera (ms)", "Recebimento (ms)", "Soma das etapas (ms)",
  ]));
  requests.forEach((r, i) => {
    lines.push(row([
      i + 1, r.url, r.domain, r.contentType, r.statusCode, r.sizeBytes, kb(r.sizeBytes),
      r.startMs, r.blockedMs, r.dnsMs, r.connectMs, r.sslMs, r.sendMs, r.waitMs, r.receiveMs, phases(r),
    ]));
  });

  return BOM + lines.join("\r\n") + "\r\n";
}

/** The comparison table: one line per address. */
export function batchCsv(tests: Array<TestRow | null | undefined>, origin: string): string {
  const lines: string[] = [];
  lines.push(row(["Endereço", "Estado", "Tempo de carregamento (ms)", "Nota", "Pontuação (0 a 100)", "Tamanho (bytes)", "Tamanho (KB)", "Requisições", "Aviso", "Link do resultado"]));
  for (const t of tests) {
    if (!t) continue;
    const notice = t.status === "done" ? blockNotice(t.docStatus) : null;
    const state = t.status === "done" ? "pronto" : t.status === "failed" ? `falhou (${t.errorCode ?? "erro"})` : t.status;
    const ok = t.status === "done" && !notice;
    lines.push(row([
      t.url, state, t.status === "done" ? t.loadMs : "", ok ? t.grade : notice ? "sem nota" : "", ok ? t.score : "",
      t.status === "done" ? t.pageBytes : "", t.status === "done" ? kb(t.pageBytes ?? 0) : "", t.status === "done" ? t.requestCount : "",
      notice ? notice.short : "", `${origin}/result/${t.publicId}`,
    ]));
  }
  return BOM + lines.join("\r\n") + "\r\n";
}

export function fileNameFor(url: string, ext = "csv"): string {
  let host = "relatorio";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* keep default */ }
  const day = new Date().toISOString().slice(0, 10);
  return `${host.replace(/[^a-z0-9.-]/gi, "_")}-${day}.${ext}`;
}

/** Browser only: hand the text to the user as a file. */
export function downloadText(name: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
