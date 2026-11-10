import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND.name}: ${BRAND.tagline}`,
  description: "Carregamos a sua página num navegador de verdade e mostramos o tempo, o peso e cada arquivo pedido.",
};

const NAV = [
  { href: "/#como", label: "Como funciona" },
  { href: "/#recursos", label: "Recursos" },
  { href: "/#faq", label: "Perguntas" },
];

// Runs before the first paint so a dark-theme visitor never sees a white flash:
// the saved choice wins, otherwise the system preference.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <header className="glass sticky top-0 z-40 border-b border-border">
          <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark size={30} />
              <span className="text-lg font-bold tracking-tight">{BRAND.name}</span>
            </Link>
            <nav aria-label="Principal" className="ml-4 hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors duration-fast hover:bg-surface hover:text-text">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Link href="/#teste" className="btn-primary h-10 px-4 text-sm">Testar agora</Link>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-border bg-surface">
          <div className="mx-auto grid max-w-content gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <LogoMark size={26} />
                <span className="font-bold">{BRAND.name}</span>
              </div>
              <p className="max-w-sm text-sm text-muted">
                Cada teste carrega a página num navegador real, sem cache. Os tempos variam de um teste para outro.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Produto</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {NAV.map((n) => (
                  <li key={n.href}><Link href={n.href} className="hover:text-text hover:underline">{n.label}</Link></li>
                ))}
                <li><Link href="/#teste" className="hover:text-text hover:underline">Fazer um novo teste</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Sobre os testes</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>Só páginas públicas</li>
                <li>Sem conta e sem cookies de rastreio</li>
                <li>Resultado visível a quem tem o link</li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
