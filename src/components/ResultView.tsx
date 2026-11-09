"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Loader2, TriangleAlert } from "lucide-react";
import type { RequestRow, RuleResult, TestRow } from "@/lib/types";
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
  timeout: "A página demorou demais para responder (mais de 60 s).",
  blocked_target: "Esse endereço não pode ser testado.",
  internal: "Erro interno ao rodar o teste. Tente de novo.",
};

const STEPS: Record<string, string> = {
  queued: "Aguardando um espaço para o teste…",
  running: "Abrindo a página e medindo cada arquivo…",
};

export function ResultView({ id }: { id: string }) {
  const [test, setTest] = useState<TestRow | null>(null);
  const [rules, setRules] = useState<RuleResult[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 45_000);
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
        <p>{STEPS[test?.status ?? "queued"]}</p>
        {slow && (
          <p className="text-sm text-muted">
            Está demorando mais que o normal. Você pode esperar ou <Link href="/" className="underline">tentar de novo</Link>.
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

  const tiles = [
    { label: "Tempo de carregamento", value: `${((test.loadMs ?? 0) / 1000).toFixed(2)} s` },
    { label: "Tamanho da página", value: formatBytes(test.pageBytes ?? 0) },
    { label: "Requisições", value: String(test.requestCount ?? 0) },
  ];

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
          <button type="button" onClick={copyLink} className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold">
            {copied ? <CheckCircle2 className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? "Link copiado" : "Copiar link"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className="text-xs text-muted">Nota de desempenho</p>
            <p className={`text-grade ${GRADE_CLASS[test.grade ?? "F"]}`} aria-label={`Nota ${test.grade}, ${test.score} de 100`}>{test.grade}</p>
            <p className="text-sm text-muted">{test.score}/100</p>
          </div>
          {tiles.map((t) => (
            <div key={t.label} className="rounded-md border border-border bg-surface p-4">
              <p className="text-xs text-muted">{t.label}</p>
              <p className="text-xl tabular-nums">{t.value}</p>
            </div>
          ))}
        </div>
      </section>

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
        <h2 id="files" className="text-lg">Arquivos pedidos</h2>
        <Waterfall requests={requests} />
        <Legend />
      </section>
    </div>
  );
}
