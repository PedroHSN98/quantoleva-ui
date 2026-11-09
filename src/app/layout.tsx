import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND.name}: ${BRAND.tagline}`,
  description: "Carregamos a sua página num navegador de verdade e mostramos o tempo, o peso e cada arquivo pedido.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="border-b border-border">
          <div className="mx-auto flex h-16 max-w-content items-center px-4">
            <Link href="/" className="text-lg font-semibold">{BRAND.name}</Link>
          </div>
        </header>
        <main className="mx-auto max-w-content px-4 py-8">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-content px-4 py-6 text-sm text-muted">
            Cada teste carrega a página num navegador real, sem cache. Os tempos variam de um teste para outro.
          </div>
        </footer>
      </body>
    </html>
  );
}
