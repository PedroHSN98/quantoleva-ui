const COLOR: Record<string, string> = {
  A: "text-grade-a", B: "text-grade-b", C: "text-grade-c", D: "text-grade-d", E: "text-grade-e", F: "text-grade-f",
};

export const VERDICT: Record<string, string> = {
  A: "Excelente", B: "Boa", C: "Regular", D: "Abaixo da média", E: "Fraca", F: "Muito fraca",
};

/** Score as a ring: the arc length is the score, the letter in the middle is the grade. */
export function GradeRing({ grade, score, size = 132 }: { grade: string; score: number; size?: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <div className={`relative ${COLOR[grade] ?? "text-muted"}`} style={{ width: size, height: size }} role="img" aria-label={`Nota ${grade}, ${score} de 100`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="11" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="text-5xl font-extrabold leading-none">{grade}</span>
        <span className="mt-1 text-sm font-semibold text-muted">{score}/100</span>
      </div>
    </div>
  );
}
