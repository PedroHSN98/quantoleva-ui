export const PHASES = [
  { key: "blockedMs", label: "Bloqueio", cls: "bg-wf-blocked" },
  { key: "dnsMs", label: "DNS", cls: "bg-wf-dns" },
  { key: "connectMs", label: "Conexão", cls: "bg-wf-connect" },
  { key: "sslMs", label: "SSL", cls: "bg-wf-ssl" },
  { key: "sendMs", label: "Envio", cls: "bg-wf-send" },
  { key: "waitMs", label: "Espera", cls: "bg-wf-wait" },
  { key: "receiveMs", label: "Recebimento", cls: "bg-wf-receive" },
] as const;

const STATUS = [
  { label: "2xx sucesso", cls: "bg-status-2xx" },
  { label: "3xx redirecionamento", cls: "bg-status-3xx" },
  { label: "4xx erro do cliente", cls: "bg-status-4xx" },
  { label: "5xx erro do servidor", cls: "bg-status-5xx" },
];

export function Legend() {
  return (
    <div className="grid gap-6 rounded-lg border border-border bg-bg p-5 text-sm shadow-card sm:grid-cols-2 sm:p-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Etapas de cada requisição</h3>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
          {PHASES.map((p) => (
            <li key={p.key} className="flex items-center gap-2">
              <span className={`h-3 w-6 rounded-sm ${p.cls}`} aria-hidden />
              {p.label}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold">Códigos de resposta</h3>
        <ul className="space-y-2">
          {STATUS.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-pill ${s.cls}`} aria-hidden />
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
