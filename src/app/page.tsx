import {
  Activity, ArrowRight, Check, ChevronDown, ClipboardPaste, Clock, FileBarChart, Gauge, Globe, Layers, ListTree, MapPin, UserX, Zap,
  type LucideIcon,
} from "lucide-react";
import { TestForm } from "@/components/TestForm";
import { Legend } from "@/components/Legend";
import { ReportPreview } from "@/components/ReportPreview";
import { listLocations } from "@/lib/data";
import { BRAND } from "@/lib/brand";
import { MAX_URLS_PER_SUBMIT, rateLimit } from "@/lib/limits";

export const dynamic = "force-dynamic"; // the location list depends on live workers

const STEPS: { title: string; text: string; Icon: LucideIcon }[] = [
  { title: "Cole o endereço", text: "Qualquer página pública. Se faltar o https://, a gente coloca.", Icon: ClipboardPaste },
  { title: "Escolha de onde testar", text: "O local do teste aparece no resultado, para você saber de onde veio o número.", Icon: MapPin },
  { title: "Leia o relatório", text: "Nota, tempo, peso e a linha do tempo de cada arquivo que a página pede.", Icon: FileBarChart },
];

const FEATURES: { title: string; text: string; Icon: LucideIcon; wide?: boolean }[] = [
  { title: "Vários endereços ao mesmo tempo", text: `Teste até ${MAX_URLS_PER_SUBMIT} sites de uma vez e compare tempo, nota e peso numa tabela só.`, Icon: Layers, wide: true },
  { title: "Resultado rápido", text: "Cada teste carrega a página uma vez, sem cache, e entrega o resultado assim que termina.", Icon: Zap },
  { title: "Navegador de verdade, sem cache", text: "Cada teste abre a página como um visitante novo.", Icon: Globe },
  { title: "Cada arquivo, etapa por etapa", text: "Bloqueio, DNS, conexão, SSL, envio, espera e recebimento.", Icon: ListTree },
  { title: "Uma nota que explica", text: "Seis regras, cada uma com pontuação e uma dica quando está abaixo de 90.", Icon: Gauge, wide: true },
  { title: "Sem conta", text: "Cole, teste e copie o link do resultado.", Icon: UserX },
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

const HERO_POINTS = [
  "Navegador de verdade, sem cache",
  "Sem conta e sem instalar nada",
  `Até ${MAX_URLS_PER_SUBMIT} endereços de uma vez`,
];

function SectionTitle({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <div className="max-w-2xl space-y-2">
      <h2 id={id} className="text-3xl font-extrabold">{title}</h2>
      {lead && <p className="text-lg font-normal text-muted">{lead}</p>}
    </div>
  );
}

export default async function Home() {
  const locations = await listLocations();
  return (
    <div>
      <section id="teste" className="on-ink relative scroll-mt-16 overflow-hidden bg-ink text-on-ink">
        <div className="bg-dots absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-content items-center gap-12 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-pill border border-ink-border bg-ink-2 px-3.5 py-1.5 text-sm font-medium text-accent-on-ink">
              <Activity className="h-4 w-4" aria-hidden />
              Teste de velocidade de páginas
            </p>
            <h1 className="text-display">{BRAND.tagline}</h1>
            <p className="max-w-xl text-lg text-on-ink-muted">
              Cole o endereço e escolha de onde testar. Mostramos o tempo, o peso e cada arquivo que a página pede.
            </p>
            <ul className="space-y-2.5">
              {HERO_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-on-ink">
                  <span className="flex h-5 w-5 items-center justify-center rounded-pill bg-ink-2 text-accent-on-ink ring-1 ring-ink-border">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <TestForm locations={locations} />
        </div>
      </section>

      <div className="mx-auto max-w-content space-y-24 px-4 py-20">
        <section aria-labelledby="problema" className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          <div className="space-y-5">
            <h2 id="problema" className="text-3xl font-extrabold">Um número sozinho engana</h2>
            <p className="text-lg text-muted">Ferramentas de velocidade costumam testar de um só lugar, e o resultado muda com a distância até o servidor.</p>
            <p className="text-lg text-muted">
              O mesmo site também dá tempos diferentes em testes seguidos, e a nota nem sempre diz o que consertar.
              Por isso mostramos o local de onde veio o resultado e o que pesa em cada arquivo, e você pode testar de novo para confirmar.
            </p>
          </div>
          <ReportPreview />
        </section>

        <section id="como" aria-labelledby="como-titulo" className="space-y-8">
          <SectionTitle id="como-titulo" title="Como funciona" />
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map(({ title, text, Icon }, i) => (
              <li key={title} className="card relative p-6">
                <span className="absolute right-5 top-4 text-5xl font-extrabold leading-none text-surface-2" aria-hidden>{i + 1}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-medium text-muted">Passo {i + 1}</p>
                <p className="text-lg">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="recursos" aria-labelledby="recursos-titulo" className="space-y-8">
          <SectionTitle id="recursos-titulo" title="O que você tem hoje" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ title, text, Icon, wide }) => (
              <li key={title} className={`card p-6 transition-shadow duration-base hover:shadow-lift ${wide ? "lg:col-span-2" : ""}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>
          <div className="rounded-lg border border-dashed border-border-input bg-surface p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4 text-muted" aria-hidden />
              Em breve (ainda não existe)
            </h3>
            <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-3">
              {SOON.map((s) => <li key={s} className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-border-input" aria-hidden />{s}</li>)}
            </ul>
          </div>
        </section>

        <section aria-labelledby="legend-title" className="space-y-8">
          <SectionTitle id="legend-title" title="Como ler o relatório" lead="As cores da linha do tempo mostram em que etapa cada arquivo gastou tempo." />
          <Legend />
        </section>

        <section aria-labelledby="preco" className="mx-auto max-w-2xl space-y-8 text-center">
          <SectionTitle id="preco" title="Preço" />
          <div className="card space-y-5 p-8 text-left">
            <p className="text-5xl font-extrabold text-accent">Grátis</p>
            <p>
              Grátis, sem conta, com limite de {rateLimit()} testes a cada 10 minutos. Planos pagos ainda não existem.
            </p>
            <ul className="space-y-2 text-sm">
              {["Sem conta e sem cartão", `Até ${MAX_URLS_PER_SUBMIT} endereços por teste`, "Relatório em CSV e plano de melhorias para baixar"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-titulo" className="mx-auto max-w-2xl space-y-8">
          <SectionTitle id="faq-titulo" title="Perguntas frequentes" />
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-bg shadow-card">
            {FAQ.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-semibold transition-colors duration-fast hover:bg-surface">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-base group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-5 pb-5 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="final" className="on-ink relative overflow-hidden bg-ink text-on-ink">
        <div className="bg-dots absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent_85%)]" aria-hidden />
        <div className="relative mx-auto flex max-w-content flex-col items-center gap-6 px-4 py-16 text-center">
          <h2 id="final" className="max-w-2xl text-3xl font-extrabold md:text-4xl">Veja onde o seu site perde tempo.</h2>
          <a href="#teste" className="inline-flex h-14 items-center justify-center gap-2 rounded-md bg-on-ink px-7 text-base font-semibold text-ink transition-colors duration-fast hover:bg-accent-soft">
            Fazer um teste
            <ArrowRight className="h-5 w-5" aria-hidden />
          </a>
        </div>
      </section>
    </div>
  );
}
