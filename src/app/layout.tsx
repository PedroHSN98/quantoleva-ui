import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medidor de Velocidade",
  description: "Teste a velocidade de carregamento de qualquer página e veja onde o tempo é gasto.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="border-b border-border">
          <div className="mx-auto flex h-16 max-w-content items-center px-4">
            <Link href="/" className="text-lg font-semibold">Medidor de Velocidade</Link>
          </div>
        </header>
        <main className="mx-auto max-w-content px-4 py-8">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-content px-4 py-6 text-sm text-muted">
            Projeto em construção. Resultados da fatia inicial são simulados.
          </div>
        </footer>
      </body>
    </html>
  );
}
