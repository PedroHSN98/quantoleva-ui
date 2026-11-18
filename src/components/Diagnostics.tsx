"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, TriangleAlert, XCircle, type LucideIcon } from "lucide-react";
import { runDiagnostics, type DiagLevel } from "@/lib/diagnostics";
import type { RequestRow } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { shortUrl } from "@/lib/short-url";

const STYLE: Record<DiagLevel, { label: string; text: string; Icon: LucideIcon }> = {
  ok: { label: "Tudo certo", text: "text-success", Icon: CheckCircle2 },
  warn: { label: "Atenção", text: "text-warning", Icon: TriangleAlert },
  fail: { label: "Crítico", text: "text-danger", Icon: XCircle },
};

export function Diagnostics({ requests, pageUrl }: { requests: RequestRow[]; pageUrl: string }) {
  const findings = useMemo(() => runDiagnostics(requests, pageUrl), [requests, pageUrl]);
  const [open, setOpen] = useState<string | null>(null);
  if (findings.length === 0) return null;

  const problems = findings.filter((f) => f.level !== "ok").length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {problems === 0
          ? "Nenhum problema encontrado nas checagens abaixo."
          : `${problems} ponto(s) de atenção. Clique para ver os arquivos envolvidos.`}
      </p>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-bg shadow-card">
        {findings.map((f) => {
          const st = STYLE[f.level];
          const expanded = open === f.key;
          const canOpen = f.files.length > 0;
          return (
            <li key={f.key}>
              <button
                type="button"
                aria-expanded={canOpen ? expanded : undefined}
                disabled={!canOpen}
                onClick={() => canOpen && setOpen(expanded ? null : f.key)}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors duration-fast enabled:hover:bg-surface disabled:cursor-default"
              >
                <st.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${st.text}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{f.title}</span>
                    <span className={`shrink-0 text-xs font-semibold ${st.text}`}>{st.label}</span>
                  </span>
                  <span className="mt-1 block text-sm text-muted">{f.detail}</span>
                </span>
                {canOpen && (
                  <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform duration-base ${expanded ? "rotate-180" : ""}`} aria-hidden />
                )}
              </button>
              {expanded && canOpen && (
                <div className="bg-surface-2 px-4 pb-4 pt-1">
                  {f.filesTitle && <p className="mb-2 text-xs font-semibold text-muted">{f.filesTitle}</p>}
                  <ul className="space-y-1.5">
                    {f.files.map((x, i) => (
                      <li key={`${x.url}-${i}`} className="flex items-baseline justify-between gap-3 text-xs">
                        <span className="truncate font-mono" title={x.url}>{shortUrl(x.url)}</span>
                        <span className="shrink-0 tabular-nums text-muted">
                          {formatBytes(x.bytes)}{x.note ? ` · ${x.note}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
