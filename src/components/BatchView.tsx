"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Plus, TriangleAlert } from "lucide-react";
import type { TestRow } from "@/lib/types";

const GRADE_CLASS: Record<string, string> = {
  A: "text-grade-a", B: "text-grade-b", C: "text-grade-c",
  D: "text-grade-d", E: "text-grade-e", F: "text-grade-f",
};

const ERRORS: Record<string, string> = {
  unreachable: "Não conseguimos abrir",
  timeout: "Não terminou de carregar",
  blocked_target: "Endereço não permitido",
  internal: "Erro interno",
};

const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;
const formatBytes = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`);
const finished = (t: TestRow | null | undefined) => t?.status === "done" || t?.status === "failed";

export function BatchView({ ids }: { ids: string[] }) {
  const [tests, setTests] = useState<Record<string, TestRow | null>>({});

  useEffect(() => {
    let stop = false;
    async function poll() {
      const next: Record<string, TestRow | null> = {};
      await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/tests/${id}`, { cache: "no-store" });
          next[id] = res.ok ? (await res.json()).test : null;
        }),
      );
      if (stop) return;
      setTests((prev) => ({ ...prev, ...next }));
      if (!ids.every((id) => finished(next[id]) || next[id] === null)) setTimeout(poll, 1000);
    }
    poll();
    return () => { stop = true; };
  }, [ids]);

  const list = ids.map((id) => tests[id]);
  const doneCount = list.filter((t) => finished(t) || t === null).length;
  const allDone = doneCount === ids.length && Object.keys(tests).length === ids.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl">Comparação de {ids.length} endereços</h1>
          <p role="status" aria-live="polite" className="text-sm text-muted">
            {allDone ? "Todos os testes terminaram." : `${doneCount} de ${ids.length} terminaram. Os testes rodam ao mesmo tempo.`}
          </p>
        </div>
        {allDone && (
          <Link href="/#teste" className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-on-accent">
            <Plus className="h-4 w-4" aria-hidden />
            Testar outros endereços
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Resultado de cada endereço testado</caption>
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <th scope="col" className="px-3 py-2">Endereço</th>
              <th scope="col" className="px-3 py-2">Estado</th>
              <th scope="col" className="px-3 py-2 text-right">Tempo</th>
              <th scope="col" className="px-3 py-2 text-center">Nota</th>
              <th scope="col" className="px-3 py-2 text-right">Tamanho</th>
              <th scope="col" className="px-3 py-2 text-right">Requisições</th>
              <th scope="col" className="px-3 py-2"><span className="sr-only">Detalhes</span></th>
            </tr>
          </thead>
          <tbody>
            {ids.map((id, i) => {
              const t = list[i];
              return (
                <tr key={id} className="border-t border-border">
                  <td className="max-w-[260px] px-3 py-2">
                    <span className="block truncate font-mono text-xs" title={t?.url}>{t ? t.url.replace(/^https?:\/\//, "") : "…"}</span>
                  </td>
                  <td className="px-3 py-2">
                    {t === undefined && <span className="inline-flex items-center gap-1"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Carregando</span>}
                    {t === null && <span className="inline-flex items-center gap-1"><TriangleAlert className="h-4 w-4 text-danger" aria-hidden />Não encontrado</span>}
                    {t && t.status === "queued" && <span>Na fila</span>}
                    {t && t.status === "running" && (
                      <span className="inline-flex items-center gap-1"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Medindo</span>
                    )}
                    {t && t.status === "done" && <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" aria-hidden />Pronto</span>}
                    {t && t.status === "failed" && (
                      <span className="inline-flex items-center gap-1"><TriangleAlert className="h-4 w-4 text-danger" aria-hidden />{ERRORS[t.errorCode ?? "internal"]}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{t?.status === "done" ? seconds(t.loadMs ?? 0) : "-"}</td>
                  <td className={`px-3 py-2 text-center text-lg font-bold ${t?.grade ? GRADE_CLASS[t.grade] : ""}`}>
                    {t?.status === "done" ? <span aria-label={`Nota ${t.grade}, ${t.score} de 100`}>{t.grade}</span> : "-"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{t?.status === "done" ? formatBytes(t.pageBytes ?? 0) : "-"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t?.status === "done" ? t.requestCount : "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {finished(t) && <Link href={`/result/${id}`} className="font-semibold text-accent underline">Ver detalhes</Link>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        Cada endereço é medido uma vez, sem cache; rode de novo se o número parecer estranho. Sites que bloqueiam acesso de fora do país ou de programas automáticos podem falhar.
      </p>
    </div>
  );
}
