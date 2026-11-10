import Link from "next/link";
import { BatchView } from "@/components/BatchView";
import { PageShell } from "@/components/PageShell";
import { MAX_URLS_PER_SUBMIT } from "@/lib/limits";

export default async function Compare({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids: raw } = await searchParams;
  const ids = [...new Set((raw ?? "").split(",").map((s) => s.trim()).filter((s) => /^[A-Za-z0-9_-]{4,32}$/.test(s)))].slice(0, MAX_URLS_PER_SUBMIT);

  if (ids.length === 0) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md space-y-4 py-10 text-center">
          <h1 className="text-xl">Nenhum teste para comparar</h1>
          <p className="text-muted">O link está incompleto.</p>
          <Link href="/" className="btn-primary h-12 px-6">Fazer um teste</Link>
        </div>
      </PageShell>
    );
  }
  return (
    <PageShell>
      <BatchView ids={ids} />
    </PageShell>
  );
}
