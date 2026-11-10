"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const THEME_KEY = "theme";

/** Sets the theme on <html> and remembers the choice. Storage can be blocked: the choice then lasts until the tab closes. */
function apply(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode or blocked storage */ }
}

export function ThemeToggle() {
  // The server cannot know the theme, so start as light and read the real one once mounted.
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);

  const label = dark ? "Mudar para o tema claro" : "Mudar para o tema escuro";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => { const next = dark ? "light" : "dark"; apply(next); setDark(next === "dark"); }}
      className="btn-secondary h-10 w-10 shrink-0"
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
