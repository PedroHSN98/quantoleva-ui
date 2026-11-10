"use client";

import { useMemo, useState } from "react";
import type { ContentType, RequestRow } from "@/lib/types";
import { PHASES } from "./Legend";
import { ICONS, Waterfall } from "./Waterfall";

type Filter = ContentType | "all";
type Sort = "time" | "size-desc" | "size-asc" | "slow";

const SORTS: { value: Sort; label: string }[] = [
  { value: "time", label: "Ordem de carregamento" },
  { value: "size-desc", label: "Maior tamanho primeiro" },
  { value: "size-asc", label: "Menor tamanho primeiro" },
  { value: "slow", label: "Mais demorados primeiro" },
];

const fmtBytes = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`);
const duration = (r: RequestRow) => PHASES.reduce((s, p) => s + r[p.key], 0);

/** "Arquivos pedidos": filter by type, sort by size or time, and the same timeline table underneath. */
export function FilesExplorer({ requests }: { requests: RequestRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("time");

  // One pass: count and bytes per type, and the length of the whole timeline.
  const { byType, totalBytes, scaleMs } = useMemo(() => {
    const byType = new Map<ContentType, { n: number; bytes: number }>();
    let totalBytes = 0;
    let scaleMs = 1;
    for (const r of requests) {
      const t = byType.get(r.contentType) ?? { n: 0, bytes: 0 };
      t.n += 1; t.bytes += r.sizeBytes;
      byType.set(r.contentType, t);
      totalBytes += r.sizeBytes;
      scaleMs = Math.max(scaleMs, r.startMs + duration(r));
    }
    return { byType, totalBytes, scaleMs };
  }, [requests]);

  const shown = useMemo(() => {
    const list = filter === "all" ? [...requests] : requests.filter((r) => r.contentType === filter);
    if (sort === "size-desc") list.sort((a, b) => b.sizeBytes - a.sizeBytes);
    else if (sort === "size-asc") list.sort((a, b) => a.sizeBytes - b.sizeBytes);
    else if (sort === "slow") list.sort((a, b) => duration(b) - duration(a));
    return list;
  }, [requests, filter, sort]);

  if (requests.length === 0) return <Waterfall requests={requests} />;

  // Only the types that exist on this page, biggest first, so the heavy ones are easy to spot.
  const types = [...byType.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
  const shownBytes = shown.reduce((s, r) => s + r.sizeBytes, 0);
  const pct = totalBytes > 0 ? Math.round((shownBytes / totalBytes) * 100) : 0;
  const biggest = shown.reduce<RequestRow | null>((m, r) => (!m || r.sizeBytes > m.sizeBytes ? r : m), null);

  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-pill border px-3.5 py-1.5 text-sm font-semibold transition-colors duration-fast ${
      active ? "border-accent bg-accent text-on-accent" : "border-border bg-bg text-text hover:bg-surface"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div role="group" aria-label="Filtrar por tipo de arquivo" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className={chip(filter === "all")}>
            Todos
            <span className="tabular-nums opacity-80">{requests.length}</span>
          </button>
          {types.map(([type, v]) => {
            const { Icon, label } = ICONS[type];
            const active = filter === type;
            return (
              <button key={type} type="button" aria-pressed={active} onClick={() => setFilter(type)} className={chip(active)}>
                <Icon className="h-4 w-4" aria-hidden />
                {label}
                <span className="tabular-nums opacity-80">{v.n}</span>
                <span className="hidden text-xs font-medium opacity-80 sm:inline">{fmtBytes(v.bytes)}</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-1">
          <label htmlFor="files-sort" className="text-xs font-semibold text-muted">Ordenar por</label>
          <select
            id="files-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}
            className="block h-10 rounded-md border border-border-input bg-bg px-3 text-sm"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-sm text-muted">
        {filter === "all"
          ? `${requests.length} arquivos, ${fmtBytes(totalBytes)} no total.`
          : `Mostrando ${shown.length} de ${requests.length} arquivos: ${ICONS[filter].label}, ${fmtBytes(shownBytes)} (${pct}% do peso da página).`}
        {biggest && shown.length > 1 && sort === "size-desc" && ` O mais pesado tem ${fmtBytes(biggest.sizeBytes)}.`}
      </p>

      <Waterfall requests={shown} scaleMs={scaleMs} />
    </div>
  );
}
