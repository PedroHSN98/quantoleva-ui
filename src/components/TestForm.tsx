"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import type { Location } from "@/lib/types";

const MESSAGES: Record<string, string> = {
  invalid_url: "Esse endereço não parece válido. Exemplo: exemplo.com.br",
  blocked_target: "Esse endereço não pode ser testado (rede interna ou porta não permitida).",
  rate_limited: "Muitos testes seguidos. Aguarde alguns minutos e tente de novo.",
  invalid_location: "Escolha um local de teste válido.",
};

export function TestForm({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState(locations[0]?.slug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, location }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(MESSAGES[data.error] ?? "Algo deu errado. Tente de novo.");
        setLoading(false);
        return;
      }
      router.push(`/result/${data.publicId}`);
    } catch {
      setError("Não foi possível falar com o servidor. Verifique sua conexão.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left" noValidate>
      <div className="space-y-1">
        <label htmlFor="url" className="text-sm font-semibold">Endereço da página</label>
        <input
          id="url" type="url" inputMode="url" autoComplete="url" required
          value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemplo.com.br"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "form-error" : undefined}
          className="h-12 w-full rounded-md border border-border-input bg-bg px-4 text-base"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="location" className="text-sm font-semibold">Testar a partir de</label>
        <select
          id="location" value={location} onChange={(e) => setLocation(e.target.value)}
          className="h-12 w-full rounded-md border border-border-input bg-bg px-3 text-base"
        >
          {locations.map((l) => (
            <option key={l.slug} value={l.slug}>{l.name} ({l.region})</option>
          ))}
        </select>
      </div>
      {locations.length === 0 && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-border border-l-4 border-l-danger bg-surface p-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
          <span>Nenhum servidor de teste está disponível agora. Tente de novo em alguns minutos.</span>
        </div>
      )}
      {error && (
        <div id="form-error" role="alert" className="flex items-start gap-2 rounded-md border border-border border-l-4 border-l-danger bg-surface p-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit" aria-busy={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-6 text-base font-semibold text-on-accent disabled:opacity-70"
        aria-disabled={loading}
        disabled={locations.length === 0}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Iniciar teste
      </button>
    </form>
  );
}
