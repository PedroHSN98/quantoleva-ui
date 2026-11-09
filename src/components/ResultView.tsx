"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Loader2, Plus, TriangleAlert } from "lucide-react";
import type { RequestRow, RuleResult, TestRow } from "@/lib/types";
import { spread } from "@/lib/median";
import { Waterfall } from "./Waterfall";
import { Legend } from "./Legend";

const GRADE_CLASS: Record<string, string> = {
  A: "text-grade-a", B: "text-grade-b", C: "text-grade-c",
  D: "text-grade-d", E: "text-grade-e", F: "text-grade-f",
};

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
  const n = Math.min(test.runsDone + 1, test.runsPlanned);
  return `Execução ${n} de ${test.runsPlanned}: abrindo a página e medindo cada arquivo…`;
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;

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
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-xl">Teste não encontrado</h1>
        <p className="text-muted">O link pode estar errado ou o resultado já foi apagado.</p>
        <Link href="/" className="inline-block rounded-md bg-accent px-6 py-3 font-semibold text-on-accent">Fazer um novo teste</Link>
      </div>
    );
  }

  if (!test || test.status === "queued" || test.status === "running") {
    return (
      <div role="status" aria-live="polite" className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
        <p>{stepText(test)}</p>
        {slow && (
          <p className="text-sm text-muted">
            Cada teste carrega a página 3 vezes, e páginas pesadas ou lentas levam mais de 1 minuto. Pode deixar esta tela aberta: o teste continua até terminar (limite de 10 minutos no total).
          </p>
        )}
      </div>
    );
  }

  if (test.status === "failed") {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div role="alert" className="flex items-start gap-2 rounded-md border border-border border-l-4 border-l-danger bg-surface p-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
          <span>{ERRORS[test.errorCode ?? "internal"]}</span>
        </div>
        <Link href="/" className="inline-block rounded-md bg-accent px-6 py-3 font-semibold text-on-accent">Tentar de novo</Link>
      </div>
    );
  }

  const many = test.runs.length > 1;
  const sp = test.runs.length > 0 ? spread(test.runs) : null;
  const tiles = [
    {
      label: many ? "Tempo de carregamento (mediana)" : "Tempo de carregamento",
      value: seconds(test.loadMs ?? 0),
      hint: sp && many ? `de ${seconds(sp.min)} a ${seconds(sp.max)} em ${test.runs.length} execuções` : undefined,
    },
    { label: "Tamanho da página", value: formatBytes(test.pageBytes ?? 0), hint: many ? "da execução mediana" : undefined },
    { label: "Requisições", value: String(test.requestCount ?? 0), hint: many ? "da execução mediana" : undefined },
  ];
  // Time until the server starts answering with the page (DNS + connection + TLS + request + wait),
  // from the first successful HTML request. This is a web response time, not an ICMP ping.
  const first = requests.find((r) => r.contentType === "html" && r.statusCode >= 200 && r.statusCode < 300) ?? requests[0];
  if (first) {
    tiles.push({
      label: "Primeira resposta do servidor",
      value: `${first.dnsMs + first.connectMs + first.sslMs + first.sendMs + first.waitMs} ms`,
      hint: "até o servidor começar a enviar a página",
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
    <div className="space-y-10">
      {test.simulated && (
        <p role="note" className="rounded-md border border-border bg-surface p-3 text-sm">
          Resultado simulado: esta é a fatia inicial do projeto, os números não são medições reais.
        </p>
      )}

      <section aria-labelledby="summary" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="summary" className="text-xl">Resultado</h1>
            <p className="break-all text-sm text-muted">{test.url}</p>
            <p className="text-sm text-muted">Local: {test.locationSlug} · {new Date(test.createdAt).toLocaleString("pt-BR")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/#teste" className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-on-accent">
              <Plus className="h-4 w-4" aria-hidden />
              Testar outro endereço
            </Link>
            <button type="button" onClick={copyLink} className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold">
              {copied ? <CheckCircle2 className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? "Link copiado" : "Copiar link"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className="text-xs text-muted">Nota de desempenho</p>
            <p className={`text-grade ${GRADE_CLASS[test.grade ?? "F"]}`} aria-label={`Nota ${test.grade}, ${test.score} de 100`}>{test.grade}</p>
            <p className="text-sm text-muted">{test.score}/100</p>
          </div>
          {tiles.map((t) => (
            <div key={t.label} className="rounded-md border border-border bg-surface p-4">
              <p className="text-xs text-muted">{t.label}</p>
              <p className="text-xl tabular-nums">{t.value}</p>
              {t.hint && <p className="text-xs text-muted">{t.hint}</p>}
            </div>
          ))}
        </div>

        {sp?.wide && (
          <p role="note" className="rounded-md border border-border border-l-4 border-l-warning bg-surface p-3 text-sm">
            Os tempos variaram bastante entre as execuções ({seconds(sp.min)} a {seconds(sp.max)}). Não confie num número só: rode de novo para confirmar.
          </p>
        )}
        {test.runs.length > 0 && test.runs.length < test.runsPlanned && (
          <p role="note" className="rounded-md border border-border bg-surface p-3 text-sm">
            Só {test.runs.length} de {test.runsPlanned} execuções terminaram, então a mediana usa {test.runs.length === 1 ? "esta única execução" : "as que terminaram"}.
          </p>
        )}
      </section>

      {many && (
        <section aria-labelledby="runs" className="space-y-3">
          <h2 id="runs" className="text-lg">Execuções</h2>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <caption className="sr-only">As execuções deste teste, com a mediana marcada</caption>
              <thead className="bg-surface text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2">Execução</th>
                  <th scope="col" className="px-3 py-2 text-right">Tempo</th>
                  <th scope="col" className="px-3 py-2 text-right">Tamanho</th>
                  <th scope="col" className="px-3 py-2 text-right">Requisições</th>
                </tr>
              </thead>
              <tbody>
                {test.runs.map((r) => (
                  <tr key={r.runNo} className={`border-t border-border ${r.isMedian ? "bg-surface-2 font-semibold" : ""}`}>
                    <td className="px-3 py-1.5">{r.runNo}{r.isMedian ? " (mediana)" : ""}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{seconds(r.loadMs)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatBytes(r.pageBytes)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{r.requestCount}</td>
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

      <section aria-labelledby="rules" className="space-y-3">
        <h2 id="rules" className="text-lg">Como melhorar</h2>
        <ul className="divide-y divide-border rounded-md border border-border">
          {rules.map((r) => (
            <li key={r.key} className="p-3">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold">{r.name}</span>
                <span className="tabular-nums text-sm">{r.score}/100</span>
              </div>
              <div className="mt-1 h-1.5 rounded-pill bg-surface-2" aria-hidden>
                <div className="h-full rounded-pill bg-accent" style={{ width: `${r.score}%` }} />
              </div>
              {r.score < 90 && <p className="mt-2 text-sm text-muted">{r.advice}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="files" className="space-y-3">
        <h2 id="files" className="text-lg">{many ? "Arquivos pedidos (execução mediana)" : "Arquivos pedidos"}</h2>
        <Waterfall requests={requests} />
        <Legend />
      </section>

      <div className="text-center">
        <Link href="/#teste" className="inline-flex h-12 items-center gap-2 rounded-md bg-accent px-6 font-semibold text-on-accent">
          <Plus className="h-4 w-4" aria-hidden />
          Testar outro endereço
        </Link>
      </div>
    </div>
  );
}
