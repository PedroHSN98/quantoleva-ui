// Diagnostics: concrete problems read from data the worker already stores (headers, redirects,
// cacheability, protocol). No new measurement. Each check returns a finding, or null when there is
// nothing to show (e.g. the protocol check on an old test that never captured it).
import type { RequestRow } from "./types";

export type DiagLevel = "ok" | "warn" | "fail";
export type DiagFile = { url: string; bytes: number; note?: string };
export type Finding = {
  key: string;
  level: DiagLevel;
  title: string;
  detail: string;
  files: DiagFile[];
  filesTitle?: string;
};

const KB = 1024;
const COMPRESSED = /\b(gzip|br|deflate|zstd)\b/i;
const TEXT_TYPES = new Set(["html", "css", "js", "text"]);
const STATIC_TYPES = new Set(["js", "css", "image", "font"]);
const ok2xx = (r: RequestRow) => r.statusCode >= 200 && r.statusCode < 300;
const toFiles = (rs: RequestRow[], note?: (r: RequestRow) => string, n = 8): DiagFile[] =>
  rs.slice(0, n).map((r) => ({ url: r.url, bytes: r.sizeBytes, note: note?.(r) }));

/** First successful HTML response: the page document. */
function mainDoc(requests: RequestRow[]): RequestRow | undefined {
  return requests.find((r) => r.contentType === "html" && ok2xx(r)) ?? requests[0];
}

export function runDiagnostics(requests: RequestRow[], pageUrl: string): Finding[] {
  const findings: Finding[] = [];
  const isHttps = pageUrl.startsWith("https://");

  // 1. Compression of text responses
  const textBig = requests.filter((r) => TEXT_TYPES.has(r.contentType) && ok2xx(r) && r.sizeBytes >= 10 * KB);
  const uncompressed = textBig.filter((r) => !COMPRESSED.test(r.contentEncoding ?? ""));
  if (textBig.length > 0) {
    findings.push(uncompressed.length === 0
      ? { key: "compression", level: "ok", title: "Compressão de texto", detail: "Os arquivos de texto (HTML, CSS, JS) chegam comprimidos.", files: [] }
      : {
          key: "compression", level: "warn",
          title: "Compressão de texto",
          detail: `${uncompressed.length} arquivo(s) de texto acima de 10 KB chegam sem compressão. Ative Brotli ou gzip no servidor: texto costuma encolher de 3 a 5 vezes.`,
          files: toFiles([...uncompressed].sort((a, b) => b.sizeBytes - a.sizeBytes)),
          filesTitle: "Arquivos sem compressão",
        });
  }

  // 2. Cache headers on static assets
  const statics = requests.filter((r) => STATIC_TYPES.has(r.contentType) && ok2xx(r));
  const noCache = statics.filter((r) => r.cacheable !== true);
  if (statics.length > 0) {
    findings.push(noCache.length === 0
      ? { key: "cache", level: "ok", title: "Cache de estáticos", detail: "Os arquivos estáticos pedem para o navegador guardar em cache.", files: [] }
      : {
          key: "cache", level: "warn",
          title: "Cache de estáticos",
          detail: `${noCache.length} arquivo(s) estáticos não têm cabeçalho de cache (Cache-Control/Expires). Sem isso, quem volta ao site baixa tudo de novo.`,
          files: toFiles([...noCache].sort((a, b) => b.sizeBytes - a.sizeBytes)),
          filesTitle: "Arquivos sem cache",
        });
  }

  // 3. Redirects
  const redirects = requests.filter((r) => r.isRedirect);
  if (redirects.length > 0) {
    findings.push({
      key: "redirects", level: "warn",
      title: "Redirecionamentos",
      detail: `${redirects.length} redirecionamento(s). Cada um custa uma ida e volta à rede antes do conteúdo real. Aponte os links direto para o endereço final.`,
      files: toFiles(redirects, (r) => `${r.statusCode} → destino`),
      filesTitle: "Requisições que redirecionam",
    });
  }

  // 4. Mixed content (https page asking for http subresources)
  if (isHttps) {
    const insecure = requests.filter((r) => r.url.startsWith("http://"));
    if (insecure.length > 0) {
      findings.push({
        key: "mixed", level: "fail",
        title: "Conteúdo misto",
        detail: `A página é HTTPS mas pede ${insecure.length} arquivo(s) em HTTP. O navegador pode bloqueá-los e o cadeado de segurança fica comprometido.`,
        files: toFiles(insecure),
        filesTitle: "Arquivos em HTTP",
      });
    }
  }

  // 5. Resource errors (4xx/5xx)
  const errors = requests.filter((r) => r.statusCode >= 400);
  if (errors.length > 0) {
    findings.push({
      key: "errors", level: errors.some((r) => r.statusCode >= 500) ? "fail" : "warn",
      title: "Arquivos com erro",
      detail: `${errors.length} arquivo(s) responderam com erro (4xx/5xx). São requisições desperdiçadas e podem quebrar partes da página.`,
      files: toFiles(errors, (r) => `código ${r.statusCode}`),
      filesTitle: "Requisições com erro",
    });
  }

  // 6. Security headers on the main document
  const doc = mainDoc(requests);
  if (doc) {
    const missing: string[] = [];
    if (!doc.hsts) missing.push("HSTS (Strict-Transport-Security)");
    if (!doc.csp) missing.push("CSP (Content-Security-Policy)");
    if (!doc.noSniff) missing.push("X-Content-Type-Options");
    findings.push(missing.length === 0
      ? { key: "security", level: "ok", title: "Cabeçalhos de segurança", detail: "A página envia os principais cabeçalhos de segurança.", files: [] }
      : {
          key: "security", level: "warn",
          title: "Cabeçalhos de segurança",
          detail: `Faltam cabeçalhos no documento principal: ${missing.join(", ")}. São boas práticas de segurança que o navegador respeita.`,
          files: [],
        });
  }

  // 7. HTTP protocol version (only when we captured it)
  const withProto = requests.filter((r) => r.protocol);
  if (withProto.length > 0) {
    const old = withProto.filter((r) => /^http\/1/i.test(r.protocol ?? ""));
    findings.push(old.length === 0
      ? { key: "protocol", level: "ok", title: "Protocolo moderno", detail: "Os arquivos são servidos por HTTP/2 ou HTTP/3.", files: [] }
      : {
          key: "protocol", level: "warn",
          title: "Protocolo HTTP/1.1",
          detail: `${old.length} arquivo(s) ainda usam HTTP/1.1. HTTP/2 e HTTP/3 carregam vários arquivos na mesma conexão e reduzem a espera.`,
          files: toFiles([...old].sort((a, b) => b.sizeBytes - a.sizeBytes), (r) => r.protocol ?? ""),
          filesTitle: "Arquivos em HTTP/1.1",
        });
  }

  // worst first: fail, then warn, then ok
  const rank: Record<DiagLevel, number> = { fail: 0, warn: 1, ok: 2 };
  findings.sort((a, b) => rank[a.level] - rank[b.level]);
  return findings;
}
