"use client";

import { useMemo, useState } from "react";
import type { ContentType, RequestRow } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { ICONS } from "./Waterfall";

// File types as a categorical identity, reusing the app's theme-aware waterfall palette
// (already tuned for light/dark and CVD). Fixed order, never cycled; the legend labels each
// slice so identity is never color-alone.
const TYPE_COLOR: Record<ContentType, string> = {
  js: "var(--wf-connect)",   // amber
  image: "var(--wf-receive)", // green
  css: "var(--wf-ssl)",      // violet
  font: "var(--wf-send)",    // pink
  html: "var(--wf-wait)",    // blue
  text: "var(--wf-dns)",     // olive
  other: "var(--wf-blocked)", // gray
};
const TYPE_ORDER: ContentType[] = ["js", "image", "css", "font", "html", "text", "other"];

function Donut({ requests }: { requests: RequestRow[] }) {
  const [hover, setHover] = useState<ContentType | null>(null);
  const { segments, total } = useMemo(() => {
    const byType = new Map<ContentType, number>();
    for (const r of requests) byType.set(r.contentType, (byType.get(r.contentType) ?? 0) + r.sizeBytes);
    const total = [...byType.values()].reduce((s, b) => s + b, 0) || 1;
    const segments = TYPE_ORDER
      .map((t) => ({ type: t, bytes: byType.get(t) ?? 0 }))
      .filter((s) => s.bytes > 0)
      .sort((a, b) => b.bytes - a.bytes);
    return { segments, total };
  }, [requests]);

  const r = 52;
  const c = 2 * Math.PI * r;
  const gap = 2; // surface ring between slices
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: 150, height: 150 }}>
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
          {segments.map((s) => {
            const frac = s.bytes / total;
            const len = Math.max(0, frac * c - gap);
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={s.type}
                cx="60" cy="60" r={r} fill="none"
                stroke={TYPE_COLOR[s.type]} strokeWidth={hover === s.type ? 17 : 14}
                strokeDasharray={dash} strokeDashoffset={-offset}
                style={{ transition: "stroke-width var(--motion-fast) var(--ease)" }}
              />
            );
            offset += frac * c;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden>
          <span className="text-lg font-bold tabular-nums">{formatBytes(total)}</span>
          <span className="text-[11px] text-muted">no total</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {segments.map((s) => {
          const { Icon, label } = ICONS[s.type];
          const pct = Math.round((s.bytes / total) * 100);
          return (
            <li
              key={s.type}
              onMouseEnter={() => setHover(s.type)} onMouseLeave={() => setHover(null)}
              className={`flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm transition-colors duration-fast ${hover === s.type ? "bg-surface" : ""}`}
            >
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: TYPE_COLOR[s.type] }} aria-hidden />
              <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <span className="flex-1 truncate">{label}</span>
              <span className="shrink-0 tabular-nums text-muted">{formatBytes(s.bytes)}</span>
              <span className="w-9 shrink-0 text-right font-semibold tabular-nums">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DomainBars({ requests }: { requests: RequestRow[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const rows = useMemo(() => {
    const byDomain = new Map<string, number>();
    for (const r of requests) byDomain.set(r.domain, (byDomain.get(r.domain) ?? 0) + 1);
    const sorted = [...byDomain.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 6).map(([domain, count]) => ({ domain, count }));
    const restCount = sorted.slice(6).reduce((s, [, n]) => s + n, 0);
    if (restCount > 0) top.push({ domain: `outros ${sorted.length - 6} domínios`, count: restCount });
    return top;
  }, [requests]);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.domain}
          onMouseEnter={() => setHover(row.domain)} onMouseLeave={() => setHover(null)}
          className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm"
        >
          <span className="truncate font-mono text-xs" title={row.domain}>{row.domain}</span>
          <span className="tabular-nums text-muted">{row.count}</span>
          <span className="col-span-2 h-2 rounded-pill bg-surface-2" aria-hidden>
            <span
              className="block h-full rounded-pill"
              style={{ width: `${Math.max(2, (row.count / max) * 100)}%`, background: "var(--accent)", opacity: hover && hover !== row.domain ? 0.5 : 1, transition: "opacity var(--motion-fast) var(--ease)" }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function WeightBreakdown({ requests }: { requests: RequestRow[] }) {
  if (requests.length === 0) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-6">
        <h3 className="mb-4 text-sm font-semibold">Peso por tipo de arquivo</h3>
        <Donut requests={requests} />
      </div>
      <div className="card p-6">
        <h3 className="mb-4 text-sm font-semibold">Requisições por domínio</h3>
        <DomainBars requests={requests} />
      </div>
    </div>
  );
}
