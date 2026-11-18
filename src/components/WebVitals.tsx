import { CheckCircle2, TriangleAlert, XCircle, type LucideIcon } from "lucide-react";
import type { TestRow } from "@/lib/types";

type Verdict = "good" | "ni" | "poor";
const STYLE: Record<Verdict, { label: string; text: string; Icon: LucideIcon }> = {
  good: { label: "Bom", text: "text-success", Icon: CheckCircle2 },
  ni: { label: "A melhorar", text: "text-warning", Icon: TriangleAlert },
  poor: { label: "Ruim", text: "text-danger", Icon: XCircle },
};

const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;

// Google's Core Web Vitals thresholds: [good upper bound, needs-improvement upper bound].
type Metric = { key: string; label: string; help: string; value?: number; format: (v: number) => string; good: number; ni: number };

function verdict(m: Metric): Verdict {
  const v = m.value!;
  return v <= m.good ? "good" : v <= m.ni ? "ni" : "poor";
}

export function WebVitals({ test }: { test: TestRow }) {
  const metrics: Metric[] = [
    { key: "lcp", label: "LCP", help: "Maior elemento visível", value: test.lcpMs, format: seconds, good: 2500, ni: 4000 },
    { key: "cls", label: "CLS", help: "Estabilidade do layout", value: test.cls, format: (v) => v.toFixed(3), good: 0.1, ni: 0.25 },
    { key: "tbt", label: "TBT", help: "Tempo de bloqueio", value: test.tbtMs, format: (v) => `${v} ms`, good: 200, ni: 600 },
    { key: "fcp", label: "FCP", help: "Primeiro conteúdo", value: test.fcpMs, format: seconds, good: 1800, ni: 3000 },
    { key: "ttfb", label: "TTFB", help: "Resposta do servidor", value: test.ttfbMs, format: (v) => `${v} ms`, good: 800, ni: 1800 },
  ];
  const present = metrics.filter((m) => m.value !== undefined && m.value !== null);
  if (present.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {present.map((m) => {
        const st = STYLE[verdict(m)];
        return (
          <div key={m.key} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{m.label}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${st.text}`}>
                <st.Icon className="h-3.5 w-3.5" aria-hidden />
                {st.label}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{m.format(m.value!)}</p>
            <p className="mt-0.5 text-xs text-muted">{m.help}</p>
          </div>
        );
      })}
    </div>
  );
}
