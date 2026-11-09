# Component specs

Icons: Lucide (MIT). Font: Inter (OFL). All copy written fresh. Colour never carries meaning alone: every colour-coded item also has a text label or icon.

```
Button
  variants  primary (bg accent), secondary (surface + border), ghost
  sizes     md 40px, lg 48px (home form submit)
  states    default, hover, active, focus-visible (2px ring accent, 2px offset), disabled, loading
  tokens    bg accent, text on-accent, radius md, font sm/600
  a11y      real <button>, loading keeps accessible name and sets aria-busy, disabled uses aria-disabled while submitting
  used on   S01

UrlInput
  states    empty, focused, filled, invalid (danger border + message), disabled
  tokens    border border-input, radius md, height 48px, font base
  a11y      <label> visible, type=url, inputmode=url, error linked with aria-describedby, aria-invalid
  behavior  adds https:// if scheme is missing, trims spaces
  used on   S01

LocationSelect
  states    default, open, focused, disabled
  a11y      native <select> (or Radix Select), label "Test from"
  used on   S01

TestProgress
  states    queued ("Waiting for a free test slot"), running (steps: opening page, loading, analysing), failed (message + retry)
  a11y      role=status, aria-live=polite, no flashing
  used on   S02

GradeBadge
  variants  A to F, color grade-*; shows letter + score number "87/100"
  tokens    font grade (64/800), radius lg, surface bg with colored letter
  a11y      text "Performance grade B, 87 out of 100" for screen readers
  used on   S03

StatTile
  content   label, value, unit (load time, page size, requests); optional hint
  tokens    surface bg, border, radius md, label xs muted, value xl
  states    value, loading skeleton, unavailable ("n/a")
  used on   S03

RuleRow (recommendations)
  content   rule name, score bar 0-100, advice text (expandable)
  states    collapsed, expanded, passing (success check), failing (warning/danger icon)
  a11y      disclosure button with aria-expanded; score as text, not colour only
  used on   S04

BreakdownChart (by type / by domain)
  variants  donut, horizontal bar; legend with value + percent
  a11y      each segment listed in a table alternative (visually hidden or toggle)
  states    filled, empty ("No data")
  used on   S05

WaterfallTable
  columns   file (truncated URL, full in title), type icon, status dot + code, size, timeline bar
  bar       stacked segments: blocked, dns, connect, ssl, send, wait, receive (colors wf-*), time axis on top
  states    collapsed row, expanded row (headers + cacheable), hover (surface bg), sorted, filtered
  tokens    mono for URLs (xs), row height 32px, expanded panel surface-2
  a11y      real <table>, expand via button aria-expanded, tooltip content also available in expanded panel, keyboard focus ring
  used on   S06

Legend
  content   state colors (7), content types (8), response codes (2xx-5xx)
  a11y      list with text labels
  used on   S01, S06

ContentTypeIcon
  icons     Lucide: file-code (html), braces (js), palette (css), image, file-text (text), file (other), triangle-alert (warning), corner-down-right (redirect)
  used on   S06, S05

StatusDot
  variants  2xx success, 3xx warning, 4xx danger, 5xx status-5xx; always shows code text next to it
  used on   S06

ErrorBanner
  variants  unreachable, blocked target, invalid URL, timeout, internal
  tokens    danger border-left, surface bg, icon
  a11y      role=alert
  used on   S01, S02

Toast (copy link)
  a11y      role=status, auto-dismiss 4s, not the only confirmation (button label changes to "Copied")
  used on   S03

ShareLink
  content   permalink field + Copy button
  used on   S03

EmptyState
  content   original copy, one action
  used on   S07 history

Header / Footer
  minimal: product name placeholder, one link row. Not a copy of the original mega menu.
```

## Layout
Max content width 1120px, 4/8 spacing scale, breakpoints 640 / 768 / 1024. Home form centered; result page is a single column on mobile, stat tiles in a 4-up grid from 768. Waterfall scrolls horizontally on small screens, file column sticky.

## Motion
120ms for hover and focus, 200ms for expand and collapse, respect `prefers-reduced-motion` (no animation).

## Assets
Own logo (replica-brand), Lucide icons, no Pingdom/SolarWinds imagery, no copied copy.
