import Link from "next/link";
import { BatchView } from "@/components/BatchView";
import { MAX_URLS_PER_SUBMIT } from "@/lib/limits";

export default async function Compare({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids: raw } = await searchParams;
  const ids = [...new Set((raw ?? "").split(",").map((s) => s.trim()).filter((s) => /^[A-Za-z0-9_-]{4,32}$/.test(s)))].slice(0, MAX_URLS_PER_SUBMIT);

  if (ids.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-xl">Nenhum teste para comparar</h1>
        <p className="text-muted">O link está incompleto.</p>
        <Link href="/" className="inline-block rounded-md bg-accent px-6 py-3 font-semibold text-on-accent">Fazer um teste</Link>
      </div>
    );
  }
  return <BatchView ids={ids} />;
}
