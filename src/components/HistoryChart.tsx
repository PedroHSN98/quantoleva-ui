"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HistoryPoint } from "@/lib/types";

const W = 320;
const H = 120;
const PAD = { left: 8, right: 8, top: 10, bottom: 10 };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/** One single-series line chart. The title names the series, so no legend is needed. */
function MiniLine({
  points, values, domainMax, format, title,
}: {
  points: HistoryPoint[];
  values: number[];
  domainMax: number;
  format: (v: number) => string;
  title: string;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  const x = (i: number) => PAD.left + (n === 1 ? 0 : (i / (n - 1)) * (W - PAD.left - PAD.right));
  const y = (v: number) => PAD.top + (1 - v / domainMax) * (H - PAD.top - PAD.bottom);
  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const active = hover ?? points.findIndex((p) => p.current);
  const shown = active >= 0 ? active : n - 1;

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted tabular-nums">
          {fmtDate(points[shown].createdAt)} · <span className="font-semibold text-text">{format(values[shown])}</span>
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`${title} ao longo de ${n} testes`}>
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.publicId}>
            {/* wide invisible hit target */}
            <circle
              cx={x(i)} cy={y(values[i])} r="12" fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onClick={() => router.push(`/result/${p.publicId}`)}
            />
            <circle
              cx={x(i)} cy={y(values[i])} r={p.current ? 5.5 : 4}
              fill={p.current ? "var(--accent)" : "var(--bg)"}
              stroke="var(--accent)" strokeWidth="2"
              className="pointer-events-none"
            />
            {i === shown && <circle cx={x(i)} cy={y(values[i])} r="8" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5" className="pointer-events-none" />}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function HistoryChart({ history }: { history: HistoryPoint[] }) {
  if (history.length < 2) return null;
  const loadMax = Math.max(...history.map((p) => p.loadMs)) * 1.1 || 1;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MiniLine
        points={history}
        values={history.map((p) => p.score)}
        domainMax={100}
        format={(v) => `${v}/100`}
        title="Nota"
      />
      <MiniLine
        points={history}
        values={history.map((p) => p.loadMs)}
        domainMax={loadMax}
        format={(v) => `${(v / 1000).toFixed(2)} s`}
        title="Tempo de carregamento"
      />
    </div>
  );
}
