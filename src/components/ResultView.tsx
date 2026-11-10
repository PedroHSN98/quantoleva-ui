"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, Copy, Download, Globe, Layers, Loader2, MapPin, Package, Plus, Timer, TriangleAlert, XCircle, Zap, type LucideIcon } from "lucide-react";
import { downloadText, fileNameFor, resultCsv } from "@/lib/export-csv";
import type { RequestRow, RuleResult, TestRow } from "@/lib/types";
import { spread } from "@/lib/median";
import { blockNotice } from "@/lib/block-notice";
import { idleText, LOAD_HINT } from "@/lib/timing";
import { GradeRing, VERDICT } from "./GradeRing";
import { ImprovementPlan } from "./ImprovementPlan";
import { FilesExplorer } from "./FilesExplorer";
import { Legend } from "./Legend";

function formatBytes(b: number) {
  return b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`;
}

const ERRORS: Record<string, string> = {
  unreachable: "Não conseguimos abrir essa página. Confira o endereço e se o site está no ar.",
  timeout: "A página não terminou de carregar em 5 minutos, então paramos o teste.",
  blocked_target: "Esse endereço não pode ser testado.",
  internal: "Erro interno ao rodar o teste. Tente de novo.",
};

function stepText(test: TestRow | null) {
  if (!test || test.status === "queued") return "Aguardando um espaço para o teste…";
  if (test.runsPlanned === 1) return "Abrindo a página e medindo cada arquivo…";
  const n = Math.min(test.runsDone + 1, test.runsPlanned);
  return `Execução ${n} de ${test.runsPlanned}: abrindo a página e medindo cada arquivo…`;
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;

function SectionHead({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <div className="space-y-1">
      <h2 id={id} className="text-2xl font-extrabold">{title}</h2>
      {lead && <p className="text-sm text-muted">{lead}</p>}
    </div>
  );
}

/** Rule level, in words and icon as well as color. */
function level(score: number): { label: string; bar: string; text: string; Icon: LucideIcon } {
  if (score >= 90) return { label: "Bom", bar: "bg-success", text: "text-success", Icon: CheckCircle2 };
  if (score >= 50) return { label: "Atenção", bar: "bg-warning", text: "text-warning", Icon: TriangleAlert };
  return { label: "Crítico", bar: "bg-danger", text: "text-danger", Icon: XCircle };
}

export function ResultView({ id }: { id: string }) {
  const [test, setTest] = useState<TestRow | null>(null);
  const [rules, setRules] = useState<RuleResult[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 20_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let stop = false;
    async function poll() {
      const res = await fetch(`/api/tests/${id}`, { cache: "no-store" });
      if (stop) return;
      if (res.status === 404) return setMissing(true);
      const data = await res.json();
      setTest(data.test);
      setRules(data.rules);
      if (data.test.status === "done") {
        const r = await fetch(`/api/tests/${id}/requests`, { cache: "no-store" });
        if (!stop) setRequests(await r.json());
      } else if (data.test.status !== "failed") {
        setTimeout(poll, 1000);
      }
    }
    poll();
    return () => { stop = true; };
  }, [id]);

  if (missing) {
    return (
      <div className="card mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-xl">Teste não encontrado</h1>
        <p className="text-muted">O link pode estar errado ou o resultado já foi apagado.</p>
        <Link href="/" className="btn-primary h-12 px-6">Fazer um novo teste</Link>
      </div>
    );
  }

  if (!test || test.status === "queued" || test.status === "running") {
    return (
      <div role="status" aria-live="polite" className="card mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-accent-soft">
          <Loader2 className="h-7 w-7 animate-spin text-accent" aria-hidden />
        </span>
        <p className="font-semibold">{stepText(test)}</p>
        {slow && (
          <p className="text-sm text-muted">
            Páginas pesadas ou lentas levam mais de 1 minuto. Pode deixar esta tela aberta: o teste continua até terminar (limite de 10 minutos no total).
          </p>
        )}
      </div>
    );
  }

  if (test.status === "failed") {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div role="alert" className="flex items-start gap-2 rounded-md border border-border border-l-4 border-l-danger bg-surface p-4 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
          <span>{ERRORS[test.errorCode ?? "internal"]}</span>
        </div>
        <Link href="/" className="btn-primary h-12 px-6">Tentar de novo</Link>
      </div>
    );
  }

  const notice = blockNotice(test.docStatus);
  const many = test.runs.length > 1;
  const sp = test.runs.length > 0 ? spread(test.runs) : null;
  const tiles: { label: string; value: string; hint?: string; Icon: LucideIcon }[] = [
    {
      label: many ? "Tempo de carregamento (mediana)" : "Tempo de carregamento",
      value: seconds(test.loadMs ?? 0),
      hint: sp && many ? `de ${seconds(sp.min)} a ${seconds(sp.max)} em ${test.runs.length} execuções` : LOAD_HINT,
      Icon: Timer,
    },
    { label: "Tamanho da página", value: formatBytes(test.pageBytes ?? 0), hint: many ? "da execução mediana" : undefined, Icon: Package },
    { label: "Requisições", value: String(test.requestCount ?? 0), hint: many ? "da execução mediana" : undefined, Icon: Layers },
  ];
  const idle = idleText(test.idleMs, test.idleReached, test.loadMs);
  if (idle) tiles.push({ label: "Rede parada", value: idle.value, hint: idle.hint, Icon: Activity });
  // Time until the server starts answering with the page (DNS + connection + TLS + request + wait),
  // from the first successful HTML request. This is a web response time, not an ICMP ping.
  const first = requests.find((r) => r.contentType === "html" && r.statusCode >= 200 && r.statusCode < 300) ?? requests[0];
  if (first) {
    tiles.push({
      label: "Primeira resposta do servidor",
      value: `${first.dnsMs + first.connectMs + first.sslMs + first.sendMs + first.waitMs} ms`,
      hint: "até o servidor começar a enviar a página",
      Icon: Zap,
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="space-y-14">
      {test.simulated && (
        <p role="note" className="rounded-md border border-border bg-surface p-3 text-sm">
          Resultado simulado: esta é a fatia inicial do projeto, os números não são medições reais.
        </p>
      )}

      <section aria-labelledby="summary" className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 space-y-2">
            <h1 id="summary" className="text-3xl font-extrabold">Resultado</h1>
            <p className="flex items-center gap-2 break-all text-base font-medium">
              <Globe className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              {test.url}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              Local: {test.locationSlug} · {new Date(test.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/#teste" className="btn-primary h-10 px-4 text-sm">
              <Plus className="h-4 w-4" aria-hidden />
              Testar outro endereço
            </Link>
            <button
              type="button"
              disabled={requests.length === 0}
              onClick={() => downloadText(fileNameFor(test.url), resultCsv(test, rules, requests))}
              className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
            >
              <Download className="h-4 w-4" aria-hidden />
              Baixar relatório (CSV)
            </button>
            <button type="button" onClick={copyLink} className="btn-secondary h-10 px-4 text-sm">
              {copied ? <CheckCircle2 className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? "Link copiado" : "Copiar link"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="card flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Nota de desempenho</p>
            {notice ? (
              <>
                <div
                  className="flex h-[132px] w-[132px] items-center justify-center rounded-pill border-[11px] border-surface-2 text-5xl font-extrabold text-muted"
                  role="img" aria-label="Sem nota: o site bloqueou o teste ou deu erro"
                >
                  <span aria-hidden>-</span>
                </div>
                <p className="text-sm font-semibold text-muted">sem nota</p>
              </>
            ) : (
              <>
                <GradeRing grade={test.grade ?? "F"} score={test.score ?? 0} />
                <p className="text-sm font-semibold">{VERDICT[test.grade ?? "F"]}</p>
              </>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {tiles.map(({ Icon, ...t }, i) => (
              // first row holds 3 tiles; the rest share the last row evenly, so the grid never ends with a hole
              <div key={t.label} className={`card relative p-5 ${i < 3 ? "xl:col-span-2" : tiles.length - 3 === 1 ? "xl:col-span-6" : tiles.length - 3 === 2 ? "xl:col-span-3" : "xl:col-span-2"}`}>
                <Icon className="absolute right-4 top-4 h-5 w-5 text-accent" aria-hidden />
                <p className="pr-8 text-xs font-medium text-muted">{t.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{t.value}</p>
                {t.hint && <p className="mt-1 text-xs font-normal text-muted">{t.hint}</p>}
              </div>
            ))}
          </div>
        </div>

        {notice && (
          <div role="note" className="flex items-start gap-3 rounded-md border border-border border-l-4 border-l-warning bg-surface p-4 text-sm">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="font-semibold">{notice.short}</p>
              <p>{notice.long}</p>
            </div>
          </div>
        )}
        {sp?.wide && (
          <p role="note" className="rounded-md border border-border border-l-4 border-l-warning bg-surface p-4 text-sm">
            Os tempos variaram bastante entre as execuções ({seconds(sp.min)} a {seconds(sp.max)}). Não confie num número só: rode de novo para confirmar.
          </p>
        )}
        {test.runs.length > 0 && test.runs.length < test.runsPlanned && (
          <p role="note" className="rounded-md border border-border bg-surface p-4 text-sm">
            Só {test.runs.length} de {test.runsPlanned} execuções terminaram, então a mediana usa {test.runs.length === 1 ? "esta única execução" : "as que terminaram"}.
          </p>
        )}
      </section>

      {many && (
        <section aria-labelledby="runs" className="space-y-4">
          <SectionHead id="runs" title="Execuções" />
          <div className="overflow-x-auto rounded-lg border border-border bg-bg shadow-card">
            <table className="w-full text-sm">
              <caption className="sr-only">As execuções deste teste, com a mediana marcada</caption>
              <thead className="bg-surface text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Execução</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Tempo</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Tamanho</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Requisições</th>
                </tr>
              </thead>
              <tbody>
                {test.runs.map((r) => (
                  <tr key={r.runNo} className={`border-t border-border ${r.isMedian ? "bg-accent-soft font-semibold" : ""}`}>
                    <td className="px-4 py-2">{r.runNo}{r.isMedian ? " (mediana)" : ""}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{seconds(r.loadMs)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatBytes(r.pageBytes)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.requestCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">
            A mediana é a execução do meio, quando se ordena pelo tempo. A nota, a lista de dicas e os arquivos abaixo vêm dela.
          </p>
        </section>
      )}

      {!notice && (
        <section aria-labelledby="rules" className="space-y-5">
          <SectionHead id="rules" title="Como melhorar" lead="Seis regras formam a nota. As que estão abaixo de 90 trazem uma dica." />
          <ul className="grid gap-4 md:grid-cols-2">
            {rules.map((r) => {
              const lv = level(r.score);
              return (
                <li key={r.key} className="card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold">{r.name}</span>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${lv.text}`}>
                      <lv.Icon className="h-4 w-4" aria-hidden />
                      <span className="tabular-nums">{r.score}/100</span>
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-pill bg-surface-2" aria-hidden>
                    <div className={`h-full rounded-pill ${lv.bar}`} style={{ width: `${Math.max(r.score, 2)}%` }} />
                  </div>
                  <p className={`mt-2 text-xs font-semibold ${lv.text}`}>{lv.label}</p>
                  {r.score < 90 && <p className="mt-1 text-sm text-muted">{r.advice}</p>}
                </li>
              );
            })}
          </ul>
          <ImprovementPlan test={test} rules={rules} requests={requests} />
        </section>
      )}

      <section aria-labelledby="files" className="space-y-5">
        <SectionHead
          id="files"
          title={many ? "Arquivos pedidos (execução mediana)" : "Arquivos pedidos"}
          lead="Cada linha é um arquivo. Filtre por tipo, ordene pelo tamanho e clique numa linha para ver o tempo de cada etapa."
        />
        <FilesExplorer requests={requests} />
        <Legend />
      </section>

      <div className="flex justify-center">
        <Link href="/#teste" className="btn-primary h-12 px-6">
          <Plus className="h-4 w-4" aria-hidden />
          Testar outro endereço
        </Link>
      </div>
    </div>
  );
}
