import type { TestFrame } from "@/lib/types";

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/** The page appearing over time: a row of screenshots, each labelled with when it was captured. */
export function Filmstrip({ frames }: { frames: TestFrame[] }) {
  if (frames.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-bg p-4 shadow-card">
      <ol className="flex gap-3">
        {frames.map((f) => (
          <li key={f.atMs} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, no remote fetch */}
            <img
              src={f.image}
              alt={`Página em ${seconds(f.atMs)}`}
              width={160}
              className="h-auto w-40 rounded-sm border border-border"
            />
            <p className="mt-1 text-center text-xs tabular-nums text-muted">{seconds(f.atMs)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
