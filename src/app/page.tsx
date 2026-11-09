import { TestForm } from "@/components/TestForm";
import { Legend } from "@/components/Legend";
import { listLocations } from "@/lib/data";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic"; // the location list depends on live workers

export default async function Home() {
  const locations = await listLocations();
  return (
    <div className="space-y-12">
      <section className="mx-auto max-w-2xl space-y-6 text-center">
        <h1 className="text-display">{BRAND.tagline}</h1>
        <p className="text-muted">
          Cole o endereço e escolha de onde testar. Mostramos o tempo, o peso e cada arquivo que a página pede.
        </p>
        <TestForm locations={locations} />
      </section>
      <section aria-labelledby="legend-title" className="space-y-4">
        <h2 id="legend-title" className="text-lg">Como ler o relatório</h2>
        <Legend />
      </section>
    </div>
  );
}
