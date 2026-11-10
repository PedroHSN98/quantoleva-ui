import { PageShell } from "@/components/PageShell";
import { ResultView } from "@/components/ResultView";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageShell>
      <ResultView id={id} />
    </PageShell>
  );
}
