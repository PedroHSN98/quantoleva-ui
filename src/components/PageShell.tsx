/** Standard page width for the inner screens (result, comparison). The home page builds its own full-width bands. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-content px-4 py-10">{children}</div>;
}
