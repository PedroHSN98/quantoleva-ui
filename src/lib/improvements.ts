// The plan "how to reach 100/100": for every rule below 100, what was measured, the goal, how many points
// it is worth, the files that matter most, and concrete steps. All numbers come from the test's own requests.
import { LIMITS, WEIGHTS } from "./grading";
import type { RequestRow, RuleResult } from "./types";

const MB = 1048576;

export type FixFile = { url: string; bytes: number; note?: string };
export type Fix = {
  key: string;
  title: string;
  /** what was measured */
  now: string;
  /** the goal for 100 on this rule */
  target: string;
  /** how many points of the final 0-100 score this rule can still add */
  gain: number;
  /** this rule's own score now (0-99) */
  ruleScore: number;
  steps: string[];
  files: FixFile[];
  /** title for the files list, when there is one */
  filesTitle?: string;
};
export type Plan = { score: number; fixes: Fix[] };

const fmtBytes = (b: number) => (b >= MB ? `${(b / MB).toFixed(2)} MB` : `${(b / 1024).toFixed(0)} KB`);
const sum = (rs: RequestRow[]) => rs.reduce((s, r) => s + r.sizeBytes, 0);
const total = (r: RequestRow) => r.blockedMs + r.dnsMs + r.connectMs + r.sslMs + r.sendMs + r.waitMs + r.receiveMs;
const top = (rs: RequestRow[], n = 5): FixFile[] =>
  [...rs].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, n).map((r) => ({ url: r.url, bytes: r.sizeBytes }));
const OLD_IMAGE = /\.(png|jpe?g|gif|bmp)$/i;
const pathOf = (u: string) => { try { return new URL(u).pathname; } catch { return u; } };

export function buildPlan(
  rules: RuleResult[], requests: RequestRow[], loadMs: number, pageBytes: number,
  idle?: { ms?: number; reached?: boolean },
): Plan {
  const weightSum = rules.reduce((s, r) => s + (WEIGHTS[r.key] ?? 1), 0) || 1;
  const gainOf = (r: RuleResult) => Math.round(((100 - r.score) * (WEIGHTS[r.key] ?? 1)) / weightSum);
  const score = Math.round(rules.reduce((s, r) => s + r.score * (WEIGHTS[r.key] ?? 1), 0) / weightSum);

  const byType = (t: string) => requests.filter((r) => r.contentType === t);
  const js = byType("js");
  const images = byType("image");
  const css = byType("css");
  const fonts = byType("font");
  const mainDomain = requests[0]?.domain;
  const fixes: Fix[] = [];

  for (const rule of rules) {
    if (rule.score >= 100) continue;
    const base = { key: rule.key, title: rule.name, gain: gainOf(rule), ruleScore: rule.score, files: [] as FixFile[], steps: [] as string[] };

    if (rule.key === "load_time") {
      const first = requests.find((r) => r.contentType === "html" && r.statusCode >= 200 && r.statusCode < 300) ?? requests[0];
      const firstMs = first ? first.dnsMs + first.connectMs + first.sslMs + first.sendMs + first.waitMs : 0;
      const slowest = [...requests].sort((a, b) => b.startMs + total(b) - (a.startMs + total(a))).slice(0, 5);
      const steps: string[] = [];
      if (firstMs > 600) steps.push(`O servidor demorou ${firstMs} ms para começar a responder. Isso é lento: use cache de página, um CDN na frente do site e veja consultas lentas no servidor. Meta: abaixo de 600 ms.`);
      else steps.push(`O servidor respondeu em ${firstMs} ms, o que é bom. O tempo está sendo gasto depois disso, carregando arquivos.`);
      if (idle?.ms !== undefined && idle.ms - loadMs >= 1500) {
        steps.push(`A página carregou (evento load) em ${(loadMs / 1000).toFixed(2)} s, mas só parou de baixar arquivos ${idle.reached === false ? "depois de" : "em"} ${(idle.ms / 1000).toFixed(2)} s. O que chega depois do load (anúncios, rastreadores, imagens sob demanda) não atrasa o carregamento, mas pesa na página e em quem tem internet lenta.`);
      }
      steps.push("Reduza o peso e o número de arquivos (veja os outros itens): é o que mais diminui o tempo.");
      steps.push("Carregue primeiro só o que aparece na tela. Imagens e scripts de baixo da página podem esperar (carregamento sob demanda).");
      steps.push("Use um CDN para servir imagens, CSS e JS de um ponto perto do visitante.");
      steps.push("O tempo medido aqui é de um servidor em um único local, sem cache. Visitantes reais, com cache, costumam ver menos.");
      fixes.push({
        ...base,
        now: `${(loadMs / 1000).toFixed(2)} s`,
        target: `até ${LIMITS.loadMs.full / 1000} s`,
        steps,
        files: slowest.map((r) => ({ url: r.url, bytes: r.sizeBytes, note: `termina em ${r.startMs + total(r)} ms` })),
        filesTitle: "Últimos arquivos a terminar de carregar",
      });
    }

    if (rule.key === "page_weight") {
      const cut = Math.max(0, pageBytes - LIMITS.pageMB.full * MB);
      const kinds: Array<[string, RequestRow[]]> = [["JavaScript", js], ["Imagens", images], ["CSS", css], ["Fontes", fonts]];
      const split = kinds.filter(([, l]) => l.length).map(([n, l]) => `${n} ${fmtBytes(sum(l))}`).join(", ");
      const steps = [`Para chegar à meta, corte pelo menos ${fmtBytes(cut)}. Divisão atual: ${split || "sem detalhe"}.`];
      steps.push("Confirme que o servidor comprime HTML, CSS e JS com Brotli ou gzip. Sem isso, texto pesa de 3 a 5 vezes mais do que precisa.");
      if (sum(js) > pageBytes * 0.25) steps.push(`JavaScript pesa ${fmtBytes(sum(js))} (${Math.round((sum(js) / pageBytes) * 100)}% da página). Remova bibliotecas que não usa, divida o código por página e minimize os arquivos.`);
      if (sum(images) > pageBytes * 0.25) steps.push(`Imagens pesam ${fmtBytes(sum(images))} (${Math.round((sum(images) / pageBytes) * 100)}% da página). Veja o item de imagens abaixo.`);
      if (sum(css) > 300 * 1024) steps.push(`CSS pesa ${fmtBytes(sum(css))}. Remova regras que nenhuma página usa e junte folhas de estilo repetidas.`);
      if (sum(fonts) > 200 * 1024) steps.push(`Fontes pesam ${fmtBytes(sum(fonts))}. Use o formato WOFF2 e carregue só os pesos e idiomas que o site usa.`);
      fixes.push({ ...base, now: fmtBytes(pageBytes), target: `até ${LIMITS.pageMB.full} MB`, steps, files: top(requests), filesTitle: "Os 5 arquivos mais pesados" });
    }

    if (rule.key === "request_count") {
      const cut = Math.max(0, requests.length - LIMITS.requests.full);
      const tiny = requests.filter((r) => r.sizeBytes < 10 * 1024);
      const steps = [`Para chegar à meta, tire pelo menos ${cut} requisições (hoje são ${requests.length}). Divisão: ${js.length} de JavaScript, ${images.length} imagens, ${css.length} CSS, ${fonts.length} fontes.`];
      if (tiny.length > 10) steps.push(`${tiny.length} arquivos têm menos de 10 KB. Junte scripts e estilos pequenos em um só arquivo, e troque ícones soltos por um conjunto único.`);
      if (images.length > 20) steps.push(`São ${images.length} imagens. Carregue sob demanda as que ficam fora da tela inicial.`);
      if (js.length > 15) steps.push("Muitos arquivos de script: agrupe-os e remova tags de terceiros (rastreadores, widgets, anúncios) que não trazem resultado.");
      steps.push("Cada requisição a mais custa uma ida e volta à rede. Elimine o que a página pede e não usa.");
      fixes.push({ ...base, now: `${requests.length} requisições`, target: `até ${LIMITS.requests.full}`, steps, files: [] });
    }

    if (rule.key === "image_weight") {
      const imgBytes = sum(images);
      const cut = Math.max(0, imgBytes - LIMITS.imageMB.full * MB);
      const old = images.filter((r) => OLD_IMAGE.test(pathOf(r.url)) && r.sizeBytes > 50 * 1024);
      const big = images.filter((r) => r.sizeBytes > 300 * 1024);
      const steps = [`As ${images.length} imagens somam ${fmtBytes(imgBytes)}. Para chegar à meta, corte pelo menos ${fmtBytes(cut)}.`];
      if (old.length) steps.push(`${old.length} imagens grandes estão em PNG, JPG ou GIF e somam ${fmtBytes(sum(old))}. Converter para WebP ou AVIF costuma reduzir de um quarto a um terço, sem perda visível.`);
      if (big.length) steps.push(`${big.length} imagens passam de 300 KB. Redimensione para o tamanho em que aparecem na tela: foto de 4000 px mostrada em 600 px é desperdício.`);
      steps.push("Carregue sob demanda as imagens que ficam abaixo da primeira tela.");
      steps.push("Banners rotativos (carrossel) costumam carregar todas as imagens de uma vez. Carregue só a primeira.");
      fixes.push({ ...base, now: fmtBytes(imgBytes), target: `até ${LIMITS.imageMB.full} MB`, steps, files: top(images), filesTitle: "As 5 imagens mais pesadas" });
    }

    if (rule.key === "blocking_scripts") {
      const cut = Math.max(0, js.length - LIMITS.scripts.full);
      const perDomain = new Map<string, { n: number; bytes: number }>();
      for (const r of js) {
        const d = perDomain.get(r.domain) ?? { n: 0, bytes: 0 };
        d.n += 1; d.bytes += r.sizeBytes;
        perDomain.set(r.domain, d);
      }
      const ranked = [...perDomain.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 5);
      const third = ranked.filter(([d]) => d !== mainDomain);
      const steps = [`Para chegar à meta, tire pelo menos ${cut} scripts (hoje são ${js.length}, somando ${fmtBytes(sum(js))}).`];
      if (third.length) steps.push(`Scripts de outros domínios: ${third.map(([d, v]) => `${d} (${v.n})`).join(", ")}. Cada um pode atrasar a página, e você não controla o servidor deles. Mantenha só os que trazem resultado.`);
      steps.push("Marque os scripts que não são necessários para mostrar a página com defer ou async, para não travarem a tela.");
      steps.push("Junte arquivos de script do próprio site em poucos pacotes.");
      fixes.push({
        ...base, now: `${js.length} scripts`, target: `até ${LIMITS.scripts.full}`, steps,
        files: ranked.map(([d, v]) => ({ url: d, bytes: v.bytes, note: `${v.n} scripts${d === mainDomain ? " (seu site)" : ""}` })),
        filesTitle: "Domínios com mais scripts",
      });
    }

    if (rule.key === "domains") {
      const perDomain = new Map<string, { n: number; bytes: number }>();
      for (const r of requests) {
        const d = perDomain.get(r.domain) ?? { n: 0, bytes: 0 };
        d.n += 1; d.bytes += r.sizeBytes;
        perDomain.set(r.domain, d);
      }
      const ranked = [...perDomain.entries()].sort((a, b) => b[1].n - a[1].n);
      const cut = Math.max(0, ranked.length - LIMITS.domains.full);
      fixes.push({
        ...base, now: `${ranked.length} domínios`, target: `até ${LIMITS.domains.full}`,
        steps: [
          `Para chegar à meta, tire pelo menos ${cut} domínios (hoje são ${ranked.length}).`,
          "Cada domínio novo exige consulta de DNS, conexão e TLS antes do primeiro byte. Isso pesa mais em celular.",
          "Hospede você mesmo fontes e bibliotecas, em vez de buscar em outro domínio.",
          "Remova rastreadores, widgets e anúncios que não trazem resultado.",
          "Para os que precisam ficar, avise o navegador antes com preconnect, para a conexão começar mais cedo.",
        ],
        files: ranked.slice(0, 8).map(([d, v]) => ({ url: d, bytes: v.bytes, note: `${v.n} requisições${d === mainDomain ? " (seu site)" : ""}` })),
        filesTitle: "Domínios que mais pedem arquivos",
      });
    }
  }

  fixes.sort((a, b) => b.gain - a.gain);
  return { score, fixes };
}

/** The same plan as plain text, for the download. */
export function planText(url: string, plan: Plan, when = new Date()): string {
  const out: string[] = [];
  out.push("PLANO PARA CHEGAR A 100/100");
  out.push(`Endereço testado: ${url}`);
  out.push(`Data: ${when.toLocaleString("pt-BR")}`);
  out.push(`Nota hoje: ${plan.score}/100`);
  out.push("");
  if (plan.fixes.length === 0) {
    out.push("Nada a melhorar: todas as regras já estão em 100.");
    return out.join("\r\n") + "\r\n";
  }
  out.push("Os itens estão em ordem de quantos pontos podem render. 'Pontos' é o que a nota final pode subir se a meta do item for atingida.");
  out.push("");
  plan.fixes.forEach((f, i) => {
    out.push(`${i + 1}. ${f.title.toUpperCase()}  (até +${f.gain} pontos)`);
    out.push(`   Hoje: ${f.now}   |   Meta: ${f.target}   |   Regra: ${f.ruleScore}/100`);
    out.push("   O que fazer:");
    f.steps.forEach((s) => out.push(`   - ${s}`));
    if (f.files.length) {
      out.push(`   ${f.filesTitle ?? "Arquivos"}:`);
      f.files.forEach((x) => out.push(`   * ${x.url}  (${fmtBytes(x.bytes)}${x.note ? `, ${x.note}` : ""})`));
    }
    out.push("");
  });
  out.push("Observação: a nota sobe em linha reta entre o limite e a meta de cada regra, então cada melhoria ajuda mesmo sem chegar à meta. Em sites grandes, chegar a 100 em tudo pode não ser realista; comece pelos itens do topo.");
  return out.join("\r\n") + "\r\n";
}
