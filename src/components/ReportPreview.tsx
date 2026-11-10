import { GradeRing } from "./GradeRing";
import { PHASES } from "./Legend";

// Made-up numbers for a made-up site. Labelled as an example on the page; never presented as a real test.
const BARS = [
  { name: "exemplo.com.br/", start: 0, parts: [4, 6, 8, 30, 10] },
  { name: "…/estilo.css", start: 52, parts: [0, 0, 0, 10, 12] },
  { name: "…/app.js", start: 54, parts: [0, 0, 0, 14, 30] },
  { name: "…/foto-capa.jpg", start: 58, parts: [0, 0, 0, 8, 28] },
  { name: "…/fonte.woff2", start: 80, parts: [0, 0, 0, 6, 12] },
];
const KEYS = [0, 1, 2, 3, 5] as const; // blocked, dns, connect, ssl, wait... shown as simplified phases

export function ReportPreview() {
  return (
    <figure className="select-none" aria-label="Exemplo ilustrativo de relatório, não é um teste real">
      <div className="overflow-hidden rounded-xl border border-border bg-bg shadow-lift" aria-hidden>
        <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-pill bg-surface-2" />
          <span className="h-2.5 w-2.5 rounded-pill bg-surface-2" />
          <span className="h-2.5 w-2.5 rounded-pill bg-surface-2" />
          <span className="ml-3 truncate rounded-md bg-bg px-3 py-1 font-mono text-xs text-muted">exemplo.com.br</span>
        </div>
        <div className="space-y-5 p-5">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <GradeRing grade="B" score={82} size={104} />
            <div className="grid w-full flex-1 grid-cols-3 gap-3">
              {[["Carregou em", "1.42 s"], ["Tamanho", "2.10 MB"], ["Requisições", "58"]].map(([k, v]) => (
                <div key={k} className="rounded-md border border-border bg-surface p-2.5 sm:p-3">
                  <p className="truncate text-xs text-muted">{k}</p>
                  <p className="text-base font-bold tabular-nums sm:text-lg">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {BARS.map((b) => (
              <div key={b.name} className="grid grid-cols-[110px_1fr] items-center gap-3">
                <span className="truncate font-mono text-xs text-muted">{b.name}</span>
                <div className="relative h-3.5 rounded-sm bg-surface">
                  <div className="absolute flex h-full overflow-hidden rounded-sm" style={{ left: `${b.start}%`, width: `${b.parts.reduce((a, c) => a + c, 0)}%` }}>
                    {b.parts.map((w, i) => w > 0 && <span key={i} className={`h-full ${PHASES[KEYS[i]].cls}`} style={{ width: `${(w / b.parts.reduce((a, c) => a + c, 0)) * 100}%` }} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">Exemplo ilustrativo. Os números são inventados para mostrar o formato do relatório.</figcaption>
    </figure>
  );
}
