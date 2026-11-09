import { TestForm } from "@/components/TestForm";
import { Legend } from "@/components/Legend";
import { listLocations } from "@/lib/data";

export default async function Home() {
  const locations = await listLocations();
  return (
    <div className="space-y-12">
      <section className="mx-auto max-w-2xl space-y-6 text-center">
        <h1 className="text-display">Quão rápida é a sua página?</h1>
        <p className="text-muted">
          Informe um endereço, escolha de onde testar e veja o tempo de carregamento, o peso e cada arquivo pedido.
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
