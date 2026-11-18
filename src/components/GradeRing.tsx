"use client";

import { useEffect, useState } from "react";

const COLOR: Record<string, string> = {
  A: "text-grade-a", B: "text-grade-b", C: "text-grade-c", D: "text-grade-d", E: "text-grade-e", F: "text-grade-f",
};

export const VERDICT: Record<string, string> = {
  A: "Excelente", B: "Boa", C: "Regular", D: "Abaixo da média", E: "Fraca", F: "Muito fraca",
};

/** Score as a ring: the arc length is the score, the letter in the middle is the grade.
 *  On mount the arc grows and the number counts up to the score (skipped under reduced motion). */
export function GradeRing({ grade, score, size = 132 }: { grade: string; score: number; size?: number }) {
  const target = Math.max(0, Math.min(100, score));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 800;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setShown(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = (shown / 100) * c;
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
        <span className="mt-1 text-sm font-semibold text-muted tabular-nums">{shown}/100</span>
      </div>
    </div>
  );
}
