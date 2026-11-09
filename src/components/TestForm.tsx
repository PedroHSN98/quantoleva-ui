"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, TriangleAlert, X } from "lucide-react";
import type { Location } from "@/lib/types";
import { MAX_URLS_PER_SUBMIT } from "@/lib/limits";

const MESSAGES: Record<string, string> = {
  invalid_url: "Esse endereço não parece válido. Exemplo: exemplo.com.br",
  blocked_target: "Esse endereço não pode ser testado (rede interna ou porta não permitida).",
  rate_limited: "Muitos testes seguidos. Aguarde alguns minutos e tente de novo.",
  invalid_location: "Escolha um local de teste válido.",
  too_many_urls: `Dá para testar até ${MAX_URLS_PER_SUBMIT} endereços de uma vez.`,
};

export function TestForm({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [urls, setUrls] = useState<string[]>([""]);
  const [location, setLocation] = useState(locations[0]?.slug ?? "");
  const [error, setError] = useState<{ text: string; index?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const setUrl = (i: number, v: string) => setUrls((u) => u.map((x, j) => (j === i ? v : x)));
  const labelFor = (i: number) => (i === 0 ? "Endereço da página" : `Outro endereço (${i + 1})`);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    // empty extra rows are ignored; the first one is required
    const filled = urls.map((u, i) => ({ u: u.trim(), i })).filter((x) => x.u !== "" || x.i === 0);
    setLoading(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls: filled.map((x) => x.u), location }),
      });
      const data = await res.json();
      if (!res.ok) {
        const row = typeof data.index === "number" ? filled[data.index]?.i : undefined;
        setError({ text: MESSAGES[data.error] ?? "Algo deu errado. Tente de novo.", index: row });
        setLoading(false);
        return;
      }
      const ids: string[] = data.publicIds ?? [data.publicId];
      router.push(ids.length === 1 ? `/result/${ids[0]}` : `/comparar?ids=${ids.join(",")}`);
    } catch {
      setError({ text: "Não foi possível falar com o servidor. Verifique sua conexão." });
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left" noValidate>
      {urls.map((value, i) => (
        <div key={i} className="space-y-1">
          <label htmlFor={`url-${i}`} className="text-sm font-semibold">{labelFor(i)}</label>
          <div className="flex gap-2">
            <input
              id={`url-${i}`} type="url" inputMode="url" autoComplete="url" required={i === 0}
              value={value} onChange={(e) => setUrl(i, e.target.value)}
              placeholder="https://exemplo.com.br"
              aria-invalid={error && (error.index === undefined ? i === 0 : error.index === i) ? true : undefined}
              aria-describedby={error ? "form-error" : undefined}
              className="h-12 w-full rounded-md border border-border-input bg-bg px-4 text-base"
            />
            {i > 0 && (
              <button
                type="button" onClick={() => setUrls((u) => u.filter((_, j) => j !== i))}
                aria-label={`Remover ${labelFor(i).toLowerCase()}`}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-surface"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      ))}

      {urls.length < MAX_URLS_PER_SUBMIT && (
        <button
          type="button" onClick={() => setUrls((u) => [...u, ""])}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Adicionar outro endereço
        </button>
      )}
      {urls.length > 1 && (
        <p className="text-sm text-muted">Os endereços são testados ao mesmo tempo e comparados numa tela só.</p>
      )}

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
          <span>{error.index !== undefined && urls.length > 1 ? `${labelFor(error.index)}: ` : ""}{error.text}</span>
        </div>
      )}
      <button
        type="submit" aria-busy={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-6 text-base font-semibold text-on-accent disabled:opacity-70"
        aria-disabled={loading}
        disabled={locations.length === 0}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {urls.length > 1 ? "Iniciar testes" : "Iniciar teste"}
      </button>
    </form>
  );
}
