import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ResultView } from "@/components/ResultView";
import { getTest } from "@/lib/data";
import { BRAND } from "@/lib/brand";

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

// Title and description that reflect the tested site and its grade, so a shared
// result link reads well. The share image is supplied by opengraph-image.tsx.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const test = await getTest(id).catch(() => null);
  if (!test) return { title: "Resultado", robots: { index: false } };

  const host = hostOf(test.url);
  const done = test.status === "done" && test.grade;
  const title = done ? `${host}: nota ${test.grade} (${test.score}/100)` : `Resultado de ${host}`;
  const description = done
    ? `${host} carregou em ${(test.loadMs! / 1000).toFixed(2)}s, nota ${test.grade}. Veja o tempo, o peso e cada arquivo que a página pede.`
    : `Teste de velocidade de ${host} no ${BRAND.name}.`;

  return {
    title,
    description,
    robots: { index: false }, // per-user result, kept out of search results
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageShell>
      <ResultView id={id} />
    </PageShell>
  );
}
