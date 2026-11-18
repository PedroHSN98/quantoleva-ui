// Lógica da tela: pega a URL, pede a medição ao processo principal e desenha o resultado.
"use strict";

const $ = (id) => document.getElementById(id);
const form = $("form"), goBtn = $("go");
const loading = $("loading"), errorBox = $("error"), result = $("result");
const MAX_URLS = 10;

const GRADE_COLOR = { A: "--grade-a", B: "--grade-b", C: "--grade-c", D: "--grade-d", E: "--grade-e", F: "--grade-f" };
const VERDICT = { A: "Excelente", B: "Bom", C: "Razoável", D: "Fraco", E: "Ruim", F: "Muito ruim" };
const ERRORS = {
  invalid_url: "Endereço inválido. Confira e tente de novo.",
  unreachable: "Não conseguimos abrir essa página. Confira o endereço e se o site está no ar.",
  timeout: "A página demorou demais para carregar, então paramos o teste.",
  blocked_target: "Esse endereço não pode ser testado.",
  internal: "Erro interno ao rodar o teste. Tente de novo.",
};
const ERRORS_SHORT = {
  invalid_url: "Endereço inválido", unreachable: "Não abriu", timeout: "Demorou demais",
  blocked_target: "Não permitido", internal: "Erro interno",
};
const CTYPE = { html: "HTML", js: "JavaScript", css: "CSS", image: "Imagem", font: "Fonte", text: "Texto", other: "Outro" };

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const seconds = (ms) => `${(ms / 1000).toFixed(2)} s`;
const bytes = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const statusColor = (code) => (code >= 200 && code < 300 ? "--success" : code >= 300 && code < 400 ? "--warning" : code === 0 ? "--muted" : "--danger");
const levelColor = (score) => (score >= 90 ? "--success" : score >= 50 ? "--warning" : "--danger");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

// ----- Campos de endereço (até 5) -----
const urlList = $("url-list");

function addUrlRow() {
  if (urlList.querySelectorAll(".url-row").length >= MAX_URLS) return;
  const row = document.createElement("div");
  row.className = "url-row";
  row.innerHTML = `<input type="text" class="url-input" placeholder="outro endereço" aria-label="Outro endereço" />
    <button type="button" class="url-remove" aria-label="Remover endereço" title="Remover">&times;</button>`;
  urlList.appendChild(row);
  row.querySelector(".url-remove").addEventListener("click", () => { row.remove(); updateAddBtn(); });
  row.querySelector(".url-input").focus();
  updateAddBtn();
}
function updateAddBtn() {
  $("add-url").style.display = urlList.querySelectorAll(".url-row").length >= MAX_URLS ? "none" : "";
}
$("add-url").addEventListener("click", addUrlRow);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const urls = [...urlList.querySelectorAll(".url-input")].map((i) => i.value.trim()).filter((v) => v);
  if (urls.length === 0) return;

  hide(errorBox); hide(result); hide($("batch"));
  goBtn.disabled = true; goBtn.textContent = "Medindo…";

  if (urls.length === 1) {
    show(loading);
    const res = await window.api.measure(urls[0]);
    hide(loading);
    goBtn.disabled = false; goBtn.textContent = "Medir";
    if (!res.ok) { errorBox.textContent = ERRORS[res.code] || ERRORS.internal; show(errorBox); return; }
    cameFromBatch = false;
    recordHistory(res.result);
    render(res.result);
  } else {
    await runBatch(urls);
    goBtn.disabled = false; goBtn.textContent = "Medir";
  }
});

// ----- Comparação de vários endereços -----
let batchResults = [];
let cameFromBatch = false;

async function runBatch(urls) {
  batchResults = urls.map((u) => ({ url: u, status: "pending" }));
  $("batch-count").textContent = String(urls.length);
  renderBatch();
  show($("batch"));

  const CONCURRENCY = 3; // mede alguns ao mesmo tempo sem pesar demais na memória
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const idx = next++;
      batchResults[idx].status = "running";
      renderBatch();
      const res = await window.api.measure(urls[idx]);
      batchResults[idx] = res.ok
        ? { url: urls[idx], status: "done", result: res.result }
        : { url: urls[idx], status: "failed", code: res.code };
      if (res.ok) recordHistory(res.result);
      renderBatch();
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
}

function renderBatch() {
  const done = batchResults.filter((b) => b.status === "done" || b.status === "failed").length;
  $("batch-status").textContent = done === batchResults.length
    ? "Todos os testes terminaram."
    : `${done} de ${batchResults.length} terminaram. Os endereços são medidos juntos.`;

  $("batch-rows").innerHTML = batchResults.map((b, idx) => {
    const name = b.url.replace(/^https?:\/\//, "");
    let state = "Na fila", grade = "-", load = "-", size = "-", req = "-", action = "";
    if (b.status === "running") state = "Medindo…";
    else if (b.status === "failed") state = ERRORS_SHORT[b.code] || "Erro";
    else if (b.status === "done") {
      const r = b.result;
      const gc = cssVar(GRADE_COLOR[r.grade] || "--accent");
      state = "Pronto";
      grade = `<span class="batch-grade" style="color:${gc};border-color:${gc}">${r.grade}</span>`;
      load = seconds(r.loadMs); size = bytes(r.pageBytes); req = String(r.requestCount);
      action = `<button class="btn-link" data-detail="${idx}">Ver detalhes</button>`;
    }
    return `<tr>
      <td class="url" title="${esc(b.url)}">${esc(name)}</td>
      <td>${state}</td>
      <td class="num">${load}</td>
      <td class="num">${grade}</td>
      <td class="num">${size}</td>
      <td class="num">${req}</td>
      <td class="num">${action}</td>
    </tr>`;
  }).join("");

  $("batch-rows").querySelectorAll("[data-detail]").forEach((el) => {
    el.addEventListener("click", () => {
      cameFromBatch = true;
      hide($("batch"));
      render(batchResults[Number(el.dataset.detail)].result);
      window.scrollTo(0, 0);
    });
  });
}

$("back-to-batch").addEventListener("click", () => { hide(result); show($("batch")); window.scrollTo(0, 0); });

function render(r) {
  // Nota
  const color = cssVar(GRADE_COLOR[r.grade] || "--accent");
  const ring = $("ring");
  ring.style.borderColor = color;
  $("grade").textContent = r.grade;
  $("grade").style.color = color;
  $("verdict").textContent = VERDICT[r.grade] || "";

  // Tiles
  const first = r.requests.find((x) => x.contentType === "html" && x.statusCode >= 200 && x.statusCode < 300) || r.requests[0];
  const server = first ? first.dnsMs + first.connectMs + first.sslMs + first.sendMs + first.waitMs : null;
  const tiles = [
    { label: "Tempo de carregamento", value: seconds(r.loadMs) },
    { label: "Tamanho da página", value: bytes(r.pageBytes) },
    { label: "Requisições", value: String(r.requestCount) },
    { label: "Primeira resposta do servidor", value: server == null ? "—" : `${server} ms` },
  ];
  $("tiles").innerHTML = tiles.map((t) => `<div class="tile"><div class="label">${t.label}</div><div class="value">${t.value}</div></div>`).join("");

  // Seções novas (dados de uma única medição)
  renderVitals(r.vitals);
  renderFilmstrip(r.frames);
  renderHistory(r.url);
  renderDiagnostics(r.requests, r.url);
  renderBreakdown(r.requests);

  // Regras
  $("rules").innerHTML = r.rules.map((rule) => {
    const c = cssVar(levelColor(rule.score));
    const advice = rule.score < 90 ? `<p class="rule-advice">${esc(rule.advice)}</p>` : "";
    return `<li class="rule">
      <div class="rule-top"><span class="rule-name">${esc(rule.name)}</span><span class="rule-score" style="color:${c}">${rule.score}/100</span></div>
      <div class="bar"><span style="width:${Math.max(rule.score, 2)}%;background:${c}"></span></div>
      ${advice}
    </li>`;
  }).join("");

  // Arquivos pedidos: guarda a lista e desenha com os filtros atuais.
  $("req-count").textContent = String(r.requestCount);
  lastRequests = r.requests;
  filter = "all";
  renderChips();
  renderFiles();

  $("back-to-batch").classList.toggle("hidden", !cameFromBatch);
  show(result);
}

// ----- Explorador de arquivos: filtro por tipo e ordenação -----
let lastRequests = [];
let filter = "all";
let sort = "load";

const duration = (q) => q.blockedMs + q.dnsMs + q.connectMs + q.sslMs + q.sendMs + q.waitMs + q.receiveMs;

function renderChips() {
  const byType = new Map();
  for (const q of lastRequests) {
    const t = byType.get(q.contentType) || { n: 0, bytes: 0 };
    t.n += 1; t.bytes += q.sizeBytes;
    byType.set(q.contentType, t);
  }
  // Só os tipos que existem na página, do mais pesado para o mais leve.
  const types = [...byType.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
  let html = `<button class="chip${filter === "all" ? " active" : ""}" data-type="all">Todos <span class="num">${lastRequests.length}</span></button>`;
  for (const [type, v] of types) {
    html += `<button class="chip${filter === type ? " active" : ""}" data-type="${type}">${CTYPE[type] || type} <span class="num">${v.n}</span> <span class="bytes">${bytes(v.bytes)}</span></button>`;
  }
  const el = $("type-chips");
  el.innerHTML = html;
  el.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => { filter = b.dataset.type; renderChips(); renderFiles(); }));
}

function renderFiles() {
  let list = filter === "all" ? [...lastRequests] : lastRequests.filter((q) => q.contentType === filter);
  if (sort === "size-desc") list.sort((a, b) => b.sizeBytes - a.sizeBytes);
  else if (sort === "size-asc") list.sort((a, b) => a.sizeBytes - b.sizeBytes);
  else if (sort === "slow") list.sort((a, b) => duration(b) - duration(a));
  else list.sort((a, b) => a.startMs - b.startMs || a.seq - b.seq); // ordem de carregamento

  const total = lastRequests.reduce((s, q) => s + q.sizeBytes, 0);
  const shownBytes = list.reduce((s, q) => s + q.sizeBytes, 0);
  if (filter === "all") {
    $("files-status").textContent = `${lastRequests.length} arquivos, ${bytes(total)} no total.`;
  } else {
    const pct = total > 0 ? Math.round((shownBytes / total) * 100) : 0;
    $("files-status").textContent = `Mostrando ${list.length} de ${lastRequests.length} arquivos: ${CTYPE[filter] || filter}, ${bytes(shownBytes)} (${pct}% do peso da página).`;
  }

  $("files").innerHTML = list.map((q) => {
    const sc = cssVar(statusColor(q.statusCode));
    const name = q.url.replace(/^https?:\/\//, "");
    const isImg = q.contentType === "image";
    // Imagens ganham miniatura, nome clicável (abre ampliada) e um botão de download.
    const cell = isImg
      ? `<div class="file-cell">
           <img class="thumb" src="${esc(q.url)}" alt="" data-full="${esc(q.url)}">
           <span class="file-link image" data-full="${esc(q.url)}" title="${esc(q.url)}">${esc(name)}</span>
           <button class="icon-btn" data-dl="${esc(q.url)}" title="Baixar imagem" aria-label="Baixar imagem">&#x2193;</button>
         </div>`
      : `<span title="${esc(q.url)}">${esc(name)}</span>`;
    return `<tr>
      <td class="url">${cell}</td>
      <td>${CTYPE[q.contentType] || q.contentType}</td>
      <td class="num"><span class="dot" style="background:${sc}"></span>${q.statusCode || "—"}</td>
      <td class="num">${bytes(q.sizeBytes)}</td>
    </tr>`;
  }).join("");

  // Clicar na miniatura ou no nome abre a imagem; a miniatura some se não carregar.
  $("files").querySelectorAll("[data-full]").forEach((el) => {
    el.addEventListener("click", () => openLightbox(el.dataset.full));
    if (el.tagName === "IMG") el.addEventListener("error", () => { el.style.visibility = "hidden"; });
  });
  // Botão de download de cada imagem.
  $("files").querySelectorAll("[data-dl]").forEach((el) => {
    el.addEventListener("click", (e) => { e.stopPropagation(); window.api.download(el.dataset.dl); });
  });
}

// ----- Visualizar imagem (lightbox) -----
let lightboxUrl = "";
function openLightbox(url) {
  lightboxUrl = url;
  $("lightbox-img").src = url;
  $("lightbox-caption").textContent = url.replace(/^https?:\/\//, "");
  $("lightbox").classList.remove("hidden");
}
function closeLightbox() {
  $("lightbox").classList.add("hidden");
  $("lightbox-img").src = "";
}
$("lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") closeLightbox(); });
$("lightbox-close").addEventListener("click", closeLightbox);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

// Ações do visualizador: copiar a URL, abrir no navegador e baixar a imagem.
$("lb-copy").addEventListener("click", async () => {
  await window.api.copy(lightboxUrl);
  const b = $("lb-copy");
  b.textContent = "Copiado!";
  setTimeout(() => { b.textContent = "Copiar URL"; }, 1500);
});
$("lb-open").addEventListener("click", () => window.api.openExternal(lightboxUrl));
$("lb-download").addEventListener("click", () => window.api.download(lightboxUrl));

$("sort-select").addEventListener("change", (e) => { sort = e.target.value; renderFiles(); });

// ----- Core Web Vitals -----
function renderVitals(v) {
  const section = $("vitals-section");
  if (!v) { hide(section); return; }
  // [label, help, value, formatter, good, needs-improvement]
  const metrics = [
    ["LCP", "Maior elemento visível", v.lcpMs, (x) => seconds(x), 2500, 4000],
    ["CLS", "Estabilidade do layout", v.cls, (x) => x.toFixed(3), 0.1, 0.25],
    ["TBT", "Tempo de bloqueio", v.tbtMs, (x) => `${x} ms`, 200, 600],
    ["FCP", "Primeiro conteúdo", v.fcpMs, (x) => seconds(x), 1800, 3000],
    ["TTFB", "Resposta do servidor", v.ttfbMs, (x) => `${x} ms`, 800, 1800],
  ].filter((m) => m[2] !== undefined && m[2] !== null);
  if (metrics.length === 0) { hide(section); return; }

  $("vitals").innerHTML = metrics.map(([label, help, value, fmt, good, ni]) => {
    const vd = value <= good ? ["Bom", "--success"] : value <= ni ? ["A melhorar", "--warning"] : ["Ruim", "--danger"];
    const c = cssVar(vd[1]);
    return `<div class="vital">
      <div class="vital-top"><span class="vital-label">${label}</span><span class="vital-verdict" style="color:${c}">${vd[0]}</span></div>
      <div class="vital-value">${fmt(value)}</div>
      <div class="vital-help">${help}</div>
    </div>`;
  }).join("");
  show(section);
}

// ----- Filmstrip -----
function renderFilmstrip(frames) {
  const section = $("filmstrip-section");
  if (!frames || frames.length === 0) { hide(section); return; }
  $("filmstrip").innerHTML = frames.map((f) => `<figure class="frame">
    <img src="${f.image}" alt="Página em ${(f.atMs / 1000).toFixed(1)} s" />
    <figcaption>${(f.atMs / 1000).toFixed(1)} s</figcaption>
  </figure>`).join("");
  show(section);
}

// ----- Diagnóstico -----
const COMPRESSED = /\b(gzip|br|deflate|zstd)\b/i;
const TEXT_TYPES = new Set(["html", "css", "js", "text"]);
const STATIC_TYPES = new Set(["js", "css", "image", "font"]);
const ok2xx = (r) => r.statusCode >= 200 && r.statusCode < 300;

function runDiagnostics(requests, pageUrl) {
  const findings = [];
  const isHttps = String(pageUrl).startsWith("https://");
  const files = (rs, note, n = 8) => rs.slice(0, n).map((r) => ({ url: r.url, bytes: r.sizeBytes, note: note ? note(r) : "" }));

  const textBig = requests.filter((r) => TEXT_TYPES.has(r.contentType) && ok2xx(r) && r.sizeBytes >= 10240);
  const uncompressed = textBig.filter((r) => !COMPRESSED.test(r.contentEncoding || ""));
  if (textBig.length) findings.push(uncompressed.length === 0
    ? { key: "compression", level: "ok", title: "Compressão de texto", detail: "Os arquivos de texto (HTML, CSS, JS) chegam comprimidos.", files: [] }
    : { key: "compression", level: "warn", title: "Compressão de texto", detail: `${uncompressed.length} arquivo(s) de texto acima de 10 KB chegam sem compressão. Ative Brotli ou gzip no servidor.`, files: files(uncompressed.slice().sort((a, b) => b.sizeBytes - a.sizeBytes)), filesTitle: "Arquivos sem compressão" });

  const statics = requests.filter((r) => STATIC_TYPES.has(r.contentType) && ok2xx(r));
  const noCache = statics.filter((r) => r.cacheable !== true);
  if (statics.length) findings.push(noCache.length === 0
    ? { key: "cache", level: "ok", title: "Cache de estáticos", detail: "Os arquivos estáticos pedem para o navegador guardar em cache.", files: [] }
    : { key: "cache", level: "warn", title: "Cache de estáticos", detail: `${noCache.length} arquivo(s) estáticos não têm cabeçalho de cache. Quem volta ao site baixa tudo de novo.`, files: files(noCache.slice().sort((a, b) => b.sizeBytes - a.sizeBytes)), filesTitle: "Arquivos sem cache" });

  const redirects = requests.filter((r) => r.isRedirect);
  if (redirects.length) findings.push({ key: "redirects", level: "warn", title: "Redirecionamentos", detail: `${redirects.length} redirecionamento(s). Cada um custa uma ida e volta à rede. Aponte os links direto para o endereço final.`, files: files(redirects, (r) => `${r.statusCode} → destino`), filesTitle: "Requisições que redirecionam" });

  if (isHttps) {
    const insecure = requests.filter((r) => r.url.startsWith("http://"));
    if (insecure.length) findings.push({ key: "mixed", level: "fail", title: "Conteúdo misto", detail: `A página é HTTPS mas pede ${insecure.length} arquivo(s) em HTTP. O navegador pode bloqueá-los.`, files: files(insecure), filesTitle: "Arquivos em HTTP" });
  }

  const errors = requests.filter((r) => r.statusCode >= 400);
  if (errors.length) findings.push({ key: "errors", level: errors.some((r) => r.statusCode >= 500) ? "fail" : "warn", title: "Arquivos com erro", detail: `${errors.length} arquivo(s) responderam com erro (4xx/5xx).`, files: files(errors, (r) => `código ${r.statusCode}`), filesTitle: "Requisições com erro" });

  const doc = requests.find((r) => r.contentType === "html" && ok2xx(r)) || requests[0];
  if (doc) {
    const missing = [];
    if (!doc.hsts) missing.push("HSTS");
    if (!doc.csp) missing.push("CSP");
    if (!doc.noSniff) missing.push("X-Content-Type-Options");
    findings.push(missing.length === 0
      ? { key: "security", level: "ok", title: "Cabeçalhos de segurança", detail: "A página envia os principais cabeçalhos de segurança.", files: [] }
      : { key: "security", level: "warn", title: "Cabeçalhos de segurança", detail: `Faltam cabeçalhos no documento principal: ${missing.join(", ")}.`, files: [] });
  }

  const withProto = requests.filter((r) => r.protocol);
  if (withProto.length) {
    const old = withProto.filter((r) => /^http\/1/i.test(r.protocol || ""));
    findings.push(old.length === 0
      ? { key: "protocol", level: "ok", title: "Protocolo moderno", detail: "Os arquivos são servidos por HTTP/2 ou HTTP/3.", files: [] }
      : { key: "protocol", level: "warn", title: "Protocolo HTTP/1.1", detail: `${old.length} arquivo(s) ainda usam HTTP/1.1. HTTP/2 e HTTP/3 reduzem a espera.`, files: files(old.slice().sort((a, b) => b.sizeBytes - a.sizeBytes), (r) => r.protocol || ""), filesTitle: "Arquivos em HTTP/1.1" });
  }

  const rank = { fail: 0, warn: 1, ok: 2 };
  findings.sort((a, b) => rank[a.level] - rank[b.level]);
  return findings;
}

const DIAG_STYLE = { ok: ["Tudo certo", "--success", "✓"], warn: ["Atenção", "--warning", "!"], fail: ["Crítico", "--danger", "×"] };

function renderDiagnostics(requests, pageUrl) {
  const section = $("diag-section");
  const findings = runDiagnostics(requests, pageUrl);
  if (findings.length === 0) { hide(section); return; }
  $("diag").innerHTML = findings.map((f) => {
    const st = DIAG_STYLE[f.level];
    const c = cssVar(st[1]);
    const fileList = f.files.length
      ? `<details class="diag-files"><summary>${f.filesTitle || "Arquivos"} (${f.files.length})</summary><ul>${f.files.map((x) => `<li><span class="diag-file-url" title="${esc(x.url)}">${esc(x.url.replace(/^https?:\/\//, ""))}</span><span class="diag-file-meta">${bytes(x.bytes)}${x.note ? " · " + esc(x.note) : ""}</span></li>`).join("")}</ul></details>`
      : "";
    return `<li class="diag-item">
      <span class="diag-badge" style="color:${c};border-color:${c}">${st[2]}</span>
      <div class="diag-body">
        <div class="diag-head"><span class="diag-title">${esc(f.title)}</span><span class="diag-level" style="color:${c}">${st[0]}</span></div>
        <p class="diag-detail">${esc(f.detail)}</p>
        ${fileList}
      </div>
    </li>`;
  }).join("");
  show(section);
}

// ----- Do que a página é feita -----
const TYPE_COLOR = { js: "#f0902a", image: "#3ecf7a", css: "#a78bfa", font: "#f472b6", html: "#6e93ff", text: "#a3b82f", other: "#8a94a3" };
const TYPE_ORDER = ["js", "image", "css", "font", "html", "text", "other"];

function renderBreakdown(requests) {
  const section = $("breakdown-section");
  if (!requests || requests.length === 0) { hide(section); return; }

  // Donut: peso por tipo
  const byType = new Map();
  for (const r of requests) byType.set(r.contentType, (byType.get(r.contentType) || 0) + r.sizeBytes);
  const total = [...byType.values()].reduce((s, b) => s + b, 0) || 1;
  const segs = TYPE_ORDER.map((t) => ({ t, bytes: byType.get(t) || 0 })).filter((s) => s.bytes > 0).sort((a, b) => b.bytes - a.bytes);

  const R = 52, C = 2 * Math.PI * R, gap = 2;
  let offset = 0;
  const circles = segs.map((s) => {
    const frac = s.bytes / total;
    const len = Math.max(0, frac * C - gap);
    const el = `<circle class="donut-seg" data-type="${s.t}" cx="60" cy="60" r="${R}" fill="none" stroke="${TYPE_COLOR[s.t]}" stroke-width="14" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-offset}"></circle>`;
    offset += frac * C;
    return el;
  }).join("");
  const legend = segs.map((s) => {
    const pct = Math.round((s.bytes / total) * 100);
    return `<li class="donut-leg" data-type="${s.t}"><span class="sw" style="background:${TYPE_COLOR[s.t]}"></span><span class="bd-name">${CTYPE[s.t] || s.t}</span><span class="bd-bytes">${bytes(s.bytes)}</span><span class="bd-pct">${pct}%</span></li>`;
  }).join("");
  $("donut").innerHTML = `
    <div class="donut-ring">
      <svg viewBox="0 0 120 120" style="transform:rotate(-90deg)">
        <circle cx="60" cy="60" r="${R}" fill="none" stroke="${cssVar("--surface-2")}" stroke-width="14"></circle>
        ${circles}
      </svg>
      <div class="donut-center"><span class="donut-total">${bytes(total)}</span><span class="donut-sub">no total</span></div>
    </div>
    <ul class="donut-legend">${legend}</ul>`;

  // Passar o mouse num tipo (segmento ou item da legenda) "levanta" a fatia e dá um brilho na cor dela.
  const donut = $("donut");
  const setHover = (type, on) => {
    const seg = donut.querySelector(`.donut-seg[data-type="${type}"]`);
    const leg = donut.querySelector(`.donut-leg[data-type="${type}"]`);
    if (seg) {
      seg.style.strokeWidth = on ? "18" : "14";
      seg.style.filter = on ? `drop-shadow(0 0 5px ${TYPE_COLOR[type]})` : "";
    }
    if (leg) leg.classList.toggle("hover", on);
  };
  donut.querySelectorAll(".donut-seg, .donut-leg").forEach((el) => {
    const type = el.dataset.type;
    el.addEventListener("mouseenter", () => setHover(type, true));
    el.addEventListener("mouseleave", () => setHover(type, false));
  });

  // Barras por domínio
  const byDomain = new Map();
  for (const r of requests) byDomain.set(r.domain, (byDomain.get(r.domain) || 0) + 1);
  const sorted = [...byDomain.entries()].sort((a, b) => b[1] - a[1]);
  const topD = sorted.slice(0, 6).map(([domain, count]) => ({ domain, count }));
  const rest = sorted.slice(6).reduce((s, [, n]) => s + n, 0);
  if (rest > 0) topD.push({ domain: `outros ${sorted.length - 6} domínios`, count: rest });
  const maxD = Math.max(1, ...topD.map((d) => d.count));
  const accent = cssVar("--accent");
  $("domain-bars").innerHTML = topD.map((d) => `<li>
    <span class="bd-domain" title="${esc(d.domain)}">${esc(d.domain)}</span>
    <span class="bd-count">${d.count}</span>
    <span class="bd-track"><span class="bd-fill" style="width:${Math.max(2, (d.count / maxD) * 100)}%;background:${accent}"></span></span>
  </li>`).join("");

  show(section);
}

// ----- Histórico local (guardado neste computador) -----
const HIST_KEY = "quantoleva:history";
const HIST_MAX = 12;

function loadHist() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY)) || {}; } catch (_) { return {}; }
}
function recordHistory(r) {
  if (!r || typeof r.score !== "number") return;
  const all = loadHist();
  const arr = all[r.url] || [];
  arr.push({ score: r.score, loadMs: r.loadMs, at: Date.now() });
  all[r.url] = arr.slice(-HIST_MAX);
  try { localStorage.setItem(HIST_KEY, JSON.stringify(all)); } catch (_) { /* storage cheia/indisponível */ }
}

/** Um mini gráfico de linha (série única). O título nomeia a série, então não precisa de legenda. */
function miniLineCard(title, points, values, domainMax, fmt) {
  const W = 320, H = 120, PL = 8, PR = 8, PT = 12, PB = 12;
  const n = values.length;
  const x = (i) => PL + (n === 1 ? 0 : (i / (n - 1)) * (W - PL - PR));
  const y = (v) => PT + (1 - v / domainMax) * (H - PT - PB);
  const accent = cssVar("--accent"), bg = cssVar("--bg");
  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const dots = points.map((p, i) => {
    const cur = i === n - 1;
    const when = new Date(p.at).toLocaleString("pt-BR");
    return `<circle cx="${x(i).toFixed(1)}" cy="${y(values[i]).toFixed(1)}" r="${cur ? 5 : 3.5}" fill="${cur ? accent : bg}" stroke="${accent}" stroke-width="2"><title>${esc(when)}: ${esc(fmt(values[i]))}</title></circle>`;
  }).join("");
  return `<div class="panel hist-card">
    <div class="hist-head"><h3 class="bd-title" style="margin:0">${title}</h3><span class="hist-now">${fmt(values[n - 1])}</span></div>
    <svg viewBox="0 0 ${W} ${H}" class="hist-svg" preserveAspectRatio="none">
      <path d="${line}" fill="none" stroke="${accent}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      ${dots}
    </svg>
  </div>`;
}

function renderHistory(url) {
  const section = $("history-section");
  const arr = loadHist()[url] || [];
  if (arr.length < 2) { hide(section); return; }
  const scores = arr.map((p) => p.score);
  const loads = arr.map((p) => p.loadMs);
  const loadMax = Math.max(...loads) * 1.1 || 1;
  $("history").innerHTML =
    miniLineCard("Nota", arr, scores, 100, (v) => `${v}/100`) +
    miniLineCard("Tempo de carregamento", arr, loads, loadMax, (v) => seconds(v));
  show(section);
}

document.querySelector(".url-input").focus();
