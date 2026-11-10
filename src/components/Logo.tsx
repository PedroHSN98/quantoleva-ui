/** The mark: a gauge with a needle. Drawn for this product, 16px to 64px. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="Quantoleva" className="shrink-0">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M7.5 21a8.5 8.5 0 0 1 17 0" fill="none" stroke="var(--on-accent)" strokeOpacity=".4" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M7.5 21a8.5 8.5 0 0 1 5.4-7.9" fill="none" stroke="var(--on-accent)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16 21l5.2-6.2" fill="none" stroke="var(--on-accent)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="21" r="2.1" fill="var(--on-accent)" />
    </svg>
  );
}
