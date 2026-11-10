import type { Config } from "tailwindcss";

// Components use roles (bg-surface, text-muted), never raw hex. Values live in tokens.css.
const v = (name: string) => `var(--${name})`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        "surface-2": v("surface-2"),
        border: v("border"),
        "border-input": v("border-input"),
        text: v("text"),
        muted: v("text-muted"),
        accent: v("accent"),
        "on-accent": v("on-accent"),
        "accent-strong": v("accent-strong"),
        "accent-soft": v("accent-soft"),
        ink: v("ink"),
        "ink-2": v("ink-2"),
        "ink-border": v("ink-border"),
        "on-ink": v("on-ink"),
        "on-ink-muted": v("on-ink-muted"),
        "accent-on-ink": v("accent-on-ink"),
        danger: v("danger"),
        success: v("success"),
        warning: v("warning"),
        grade: {
          a: v("grade-a"), b: v("grade-b"), c: v("grade-c"),
          d: v("grade-d"), e: v("grade-e"), f: v("grade-f"),
        },
        wf: {
          blocked: v("wf-blocked"), dns: v("wf-dns"), connect: v("wf-connect"),
          ssl: v("wf-ssl"), send: v("wf-send"), wait: v("wf-wait"), receive: v("wf-receive"),
        },
        status: { "2xx": v("status-2xx"), "3xx": v("status-3xx"), "4xx": v("status-4xx"), "5xx": v("status-5xx") },
      },
      fontFamily: { sans: [v("font-sans")], mono: [v("font-mono")] },
      fontSize: {
        xs: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        xl: ["28px", { lineHeight: "34px", fontWeight: "700" }],
        display: ["clamp(32px, 4.4vw, 52px)", { lineHeight: "1.08", fontWeight: "800", letterSpacing: "-0.025em" }],
        grade: ["64px", { lineHeight: "64px", fontWeight: "800" }],
      },
      borderRadius: { sm: v("radius-sm"), md: v("radius-md"), lg: v("radius-lg"), xl: v("radius-xl"), pill: v("radius-pill") },
      boxShadow: { card: v("shadow-card"), lift: v("shadow-lift"), pop: v("shadow-pop") },
      maxWidth: { content: v("content-max") },
      transitionDuration: { fast: "120ms", base: "200ms" },
    },
  },
} satisfies Config;
