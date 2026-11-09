# Test plan

Runs against the local clone only (never the original). Needs Postgres (`npm run db:up`) and the worker (`npm run worker`) running. Suite: `npx playwright test` (desktop 1440 px and mobile 390 px projects, rate limit raised to 1000 for the run). Every test also fails on console errors (other than expected 4xx) and on any 5xx.

Result column: A = automated and passing, M = manual / verified by hand earlier, T = still to do.

## F01 Run a test (S01 -> S02 -> S03)
| id | case | result |
| --- | --- | --- |
| F01-H0 | home renders, labelled fields | A |
| F01-H1 | example.com gives graded report, summary tiles, table, no stale "simulated" copy, small size shown in KB | A |
| F01-A1 | axe WCAG A/AA on home | A |
| F01-A2 | axe WCAG A/AA on result | A |
| F01-E1 | empty input shows error | A |
| F01-E2 | garbage text shows error | A |
| F01-E3 | double click on submit creates one test | A |
| F01-E4 | refresh on result page keeps the test | A |
| F01-E5 | keyboard only (type, Enter) works | A |
| F01-E6 | no horizontal page scroll at 390 and 1440 | A |
| F01-E7 | very long URL (2049+ chars) rejected | T |
| F01-E8 | URL with accents / emoji host (punycode) | T |
| F01-E9 | slow site (> 5 min) gives timeout error | T |
| F01-E10 | worker down: user is told, not left waiting | A (home shows "no server" alert when no worker; result shows slow hint after 20 s, hint not covered) |
| F01-N1 | 127.0.0.1 refused | A |
| F01-N2 | file:// refused | A |
| F01-N3 | unknown domain shows unreachable | A |
| F01-N4 | hostname resolving to 127.0.0.1 (localtest.me) blocked | A |
| F01-N5 | unknown result id shows not found | A |
| F01-N6 | 6th test in 10 minutes returns 429 and a message | M (curl, before the suite; suite raises the limit) |
| F01-N7 | redirect to a private address is blocked | T |
| F01-N8 | page with 4xx/5xx main document | T |

## F02 Inspect a slow file (S03 -> S06)
| F02-H1 | expand a row shows phase timings, one open at a time | A |
| F02-E1 | very long file URL truncates, full URL in title and expanded panel | T |
| F02-E2 | waterfall usable at 390 px (horizontal scroll, sticky file column) | M (screenshot reviewed) |
| F02-E3 | keyboard: toggle with Enter/Space | T |

## F03 Read a recommendation (S04)
| F03-H1 | rules listed worst first, advice shown under 90 | M (screenshot) |
| F03-E1 | all rules 100 shows no advice text | M (example.com) |

## F04 Share a result
| F04-H1 | permalink opens the same result in a new tab | A |
| F04-H2 | "Copiar link" copies the URL and shows confirmation | T |

## Cross-cutting
| X-1 | no secrets in client bundle, `.env*` ignored | M (git status) |
| X-2 | cookie / authorization headers not stored | T (query DB for a page that sets cookies) |
| X-3 | two workers never take the same job | M (two workers ran together without duplicate results) |
