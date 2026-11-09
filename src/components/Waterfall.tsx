"use client";

import { Fragment, useState } from "react";
import { Braces, ChevronDown, File, FileCode, FileText, Image as ImageIcon, Palette, Type } from "lucide-react";
import type { ContentType, RequestRow } from "@/lib/types";
import { PHASES } from "./Legend";

const ICONS: Record<ContentType, { Icon: typeof File; label: string }> = {
  html: { Icon: FileCode, label: "HTML" },
  js: { Icon: Braces, label: "JavaScript" },
  css: { Icon: Palette, label: "CSS" },
  image: { Icon: ImageIcon, label: "Imagem" },
  text: { Icon: FileText, label: "Texto" },
  font: { Icon: Type, label: "Fonte" },
  other: { Icon: File, label: "Outro" },
};

function statusClass(code: number) {
  if (code >= 500) return "bg-status-5xx";
  if (code >= 400) return "bg-status-4xx";
  if (code >= 300) return "bg-status-3xx";
  return "bg-status-2xx";
}

const fmtBytes = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`);

export function Waterfall({ requests }: { requests: RequestRow[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const total = Math.max(1, ...requests.map((r) => r.startMs + PHASES.reduce((s, p) => s + r[p.key], 0)));

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="sr-only">Arquivos pedidos pela página, com a linha do tempo de cada um</caption>
        <thead className="bg-surface text-left text-xs text-muted">
          <tr>
            <th scope="col" className="sticky left-0 bg-surface px-3 py-2">Arquivo</th>
            <th scope="col" className="px-3 py-2">Tipo</th>
            <th scope="col" className="px-3 py-2">Código</th>
            <th scope="col" className="px-3 py-2 text-right">Tamanho</th>
            <th scope="col" className="w-[40%] px-3 py-2">Linha do tempo ({total} ms)</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const { Icon, label } = ICONS[r.contentType];
            const expanded = open === r.seq;
            const duration = PHASES.reduce((s, p) => s + r[p.key], 0);
            return (
              <Fragment key={r.seq}>
                <tr className="border-t border-border hover:bg-surface">
                  <td className="sticky left-0 max-w-[260px] bg-bg px-3 py-1.5">
                    <button
                      type="button" aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : r.seq)}
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-base ${expanded ? "rotate-180" : ""}`} aria-hidden />
                      <span className="truncate font-mono text-xs" title={r.url}>{r.url.replace(/^https?:\/\//, "")}</span>
                    </button>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="inline-flex items-center gap-1"><Icon className="h-4 w-4" aria-hidden />{label}</span>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-pill ${statusClass(r.statusCode)}`} aria-hidden />
                      {r.statusCode}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtBytes(r.sizeBytes)}</td>
                  <td className="px-3 py-1.5">
                    <div className="relative h-4" role="img" aria-label={`${duration} ms, começando em ${r.startMs} ms`}>
                      <div className="absolute flex h-full" style={{ left: `${(r.startMs / total) * 100}%`, width: `${(duration / total) * 100}%` }}>
                        {PHASES.map((p) => r[p.key] > 0 && (
                          <span key={p.key} className={`h-full ${p.cls}`} style={{ width: `${(r[p.key] / duration) * 100}%` }} />
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
                {expanded && (
                  <tr key={`${r.seq}-d`} className="bg-surface-2">
                    <td colSpan={5} className="px-4 py-3">
                      <p className="mb-2 break-all font-mono text-xs">{r.url}</p>
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
                        {PHASES.map((p) => (
                          <div key={p.key} className="flex items-center gap-2">
                            <span className={`h-2.5 w-4 rounded-sm ${p.cls}`} aria-hidden />
                            <dt className="text-muted">{p.label}</dt>
                            <dd className="ml-auto tabular-nums">{r[p.key]} ms</dd>
                          </div>
                        ))}
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
