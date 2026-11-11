"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download, Lightbulb } from "lucide-react";
import { downloadText, fileNameFor } from "@/lib/export-csv";
import { buildPlan, planText } from "@/lib/improvements";
import type { RequestRow, RuleResult, TestRow } from "@/lib/types";

const fmtBytes = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(0)} KB`);

export function ImprovementPlan({ test, rules, requests }: { test: TestRow; rules: RuleResult[]; requests: RequestRow[] }) {
  const [open, setOpen] = useState(false);
  const plan = useMemo(
    () => buildPlan(rules, requests, test.loadMs ?? 0, test.pageBytes ?? 0, { ms: test.idleMs, reached: test.idleReached }),
    [rules, requests, test.loadMs, test.pageBytes, test.idleMs, test.idleReached],
  );
  const ready = requests.length > 0;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="plano"
          disabled={!ready}
          onClick={() => setOpen((v) => !v)}
          className="btn-primary h-10 px-4 text-sm disabled:opacity-60"
        >
          <Lightbulb className="h-4 w-4" aria-hidden />
          Como chegar a 100/100
          {open ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={() => downloadText("plano-" + fileNameFor(test.url, "txt"),"﻿" + planText(test.url, plan), "text/plain;charset=utf-8")}
          className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
        >
          <Download className="h-4 w-4" aria-hidden />
          Baixar plano de melhorias
        </button>
      </div>

      {open && (
        <section id="plano" aria-labelledby="plano-titulo" className="space-y-4 rounded-lg border border-border bg-surface p-4">
          <div>
            <h3 id="plano-titulo" className="text-lg">Plano para chegar a 100/100</h3>
            <p className="text-sm text-muted">
              Nota hoje: {plan.score}/100. {plan.fixes.length === 0
                ? "Todas as regras já estão em 100: não há o que melhorar."
                : `Os itens estão em ordem de quantos pontos podem render. Atingindo todas as metas, a nota vai a 100.`}
            </p>
          </div>

          <ol className="space-y-4">
            {plan.fixes.map((f) => (
              <li key={f.key} className="rounded-md border border-border bg-bg p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-semibold">{f.title}</h4>
                  <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-xs font-semibold">até +{f.gain} pontos</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Hoje: <strong className="text-text">{f.now}</strong> · Meta: <strong className="text-text">{f.target}</strong> · Regra: {f.ruleScore}/100
                </p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
                  {f.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
                {f.files.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted">{f.filesTitle ?? "Arquivos"}</p>
                    <ul className="mt-1 divide-y divide-border rounded-md border border-border text-xs">
                      {f.files.map((x, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 px-2 py-1.5">
                          <span className="min-w-0 truncate font-mono" title={x.url}>{x.url.replace(/^https?:\/\//, "")}</span>
                          <span className="shrink-0 tabular-nums text-muted">{fmtBytes(x.bytes)}{x.note ? ` · ${x.note}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ol>

          {plan.fixes.length > 0 && (
            <p className="text-xs text-muted">
              A nota sobe em linha reta entre o limite e a meta de cada regra, então cada melhoria ajuda mesmo sem chegar à meta. Em sites grandes, chegar a 100 em tudo pode não ser realista: comece pelos itens do topo.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
