import { TestForm } from "@/components/TestForm";
import { Legend } from "@/components/Legend";
import { listLocations } from "@/lib/data";
import { BRAND } from "@/lib/brand";
import { MAX_URLS_PER_SUBMIT, rateLimit } from "@/lib/limits";

export const dynamic = "force-dynamic"; // the location list depends on live workers

const STEPS = [
  { title: "Cole o endereço", text: "Qualquer página pública. Se faltar o https://, a gente coloca." },
  { title: "Escolha de onde testar", text: "O local do teste aparece no resultado, para você saber de onde veio o número." },
  { title: "Leia o relatório", text: "Nota, tempo, peso e a linha do tempo de cada arquivo que a página pede." },
];

const FEATURES = [
  { title: "Vários endereços ao mesmo tempo", text: `Teste até ${MAX_URLS_PER_SUBMIT} sites de uma vez e compare tempo, nota e peso numa tabela só.` },
  { title: "Resultado rápido", text: "Cada teste carrega a página uma vez, sem cache, e entrega o resultado assim que termina." },
  { title: "Navegador de verdade, sem cache", text: "Cada teste abre a página como um visitante novo." },
  { title: "Cada arquivo, etapa por etapa", text: "Bloqueio, DNS, conexão, SSL, envio, espera e recebimento." },
  { title: "Uma nota que explica", text: "Seis regras, cada uma com pontuação e uma dica quando está abaixo de 90." },
  { title: "Sem conta", text: "Cole, teste e copie o link do resultado." },
];

const SOON = [
  "Mais de um local de teste, lado a lado",
  "Explicação, arquivo por arquivo, do que mudar",
  "Perfil de celular",
];

const FAQ = [
  {
    q: "Os tempos são iguais aos do meu navegador?",
    a: "Não. O teste roda num navegador de servidor, sem cache, e os tempos mudam a cada carregamento. Cada teste carrega a página uma vez. Rode de novo para confirmar se o número parecer estranho.",
  },
  {
    q: "Por que só um local de teste?",
    a: "Hoje existe um servidor de teste. Mais locais entram quando houver mais servidores.",
  },
  { q: "Quem vê o meu resultado?", a: "Qualquer pessoa que tenha o link do resultado." },
  { q: "Posso testar uma página com senha?", a: "Não. Só páginas públicas." },
  {
    q: "Vocês guardam cookies ou senhas das páginas testadas?",
    a: "Não guardamos cookies nem cabeçalhos de autorização. Guardamos o endereço testado e o resultado, para o link funcionar.",
  },
];

export default async function Home() {
  const locations = await listLocations();
  return (
    <div className="space-y-16">
      <section id="teste" className="mx-auto max-w-2xl scroll-mt-8 space-y-6 text-center">
        <h1 className="text-display">{BRAND.tagline}</h1>
        <p className="text-muted">
          Cole o endereço e escolha de onde testar. Mostramos o tempo, o peso e cada arquivo que a página pede.
        </p>
        <TestForm locations={locations} />
      </section>

      <section aria-labelledby="problema" className="mx-auto max-w-2xl space-y-3">
        <h2 id="problema" className="text-xl">Um número sozinho engana</h2>
        <p>Ferramentas de velocidade costumam testar de um só lugar, e o resultado muda com a distância até o servidor.</p>
        <p>
          O mesmo site também dá tempos diferentes em testes seguidos, e a nota nem sempre diz o que consertar.
          Por isso mostramos o local de onde veio o resultado e o que pesa em cada arquivo, e você pode testar de novo para confirmar.
        </p>
      </section>

      <section aria-labelledby="como" className="space-y-4">
        <h2 id="como" className="text-xl">Como funciona</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-muted">Passo {i + 1}</p>
              <p className="text-lg">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="recursos" className="space-y-4">
        <h2 id="recursos" className="text-xl">O que você tem hoje</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-lg border border-border p-4">
              <p className="font-semibold">{f.title}</p>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-semibold">Em breve (ainda não existe)</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {SOON.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </section>

      <section aria-labelledby="legend-title" className="space-y-4">
        <h2 id="legend-title" className="text-xl">Como ler o relatório</h2>
        <Legend />
      </section>

      <section aria-labelledby="preco" className="mx-auto max-w-2xl space-y-3">
        <h2 id="preco" className="text-xl">Preço</h2>
        <p>
          Grátis, sem conta, com limite de {rateLimit()} testes a cada 10 minutos. Planos pagos ainda não existem.
        </p>
      </section>

      <section aria-labelledby="faq" className="mx-auto max-w-2xl space-y-3">
        <h2 id="faq" className="text-xl">Perguntas frequentes</h2>
        <div className="divide-y divide-border rounded-md border border-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-4">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="final" className="space-y-4 text-center">
        <h2 id="final" className="text-xl">Veja onde o seu site perde tempo.</h2>
        <a href="#teste" className="inline-flex h-12 items-center rounded-md bg-accent px-6 font-semibold text-on-accent">
          Fazer um teste
        </a>
      </section>
    </div>
  );
}
