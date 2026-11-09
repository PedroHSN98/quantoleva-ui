# Build log

| ID | date | status | missing / notes |
| --- | --- | --- | --- |
| shell | 2026-11-09 | done | Next.js 15 + Tailwind 3, tokens wired, layout |
| S01 home form | 2026-11-09 | done | works; 390/1440 px and keyboard pass not yet verified in a browser |
| S02 in progress | 2026-11-09 | done | polls every 1 s; failed state UI exists but the fake runner never fails |
| S03 summary | 2026-11-09 | partial | grade, load time, size, requests, copy link |
| S04 recommendations | 2026-11-09 | partial | 6 original rules |
| S05 breakdowns | - | not started | |
| S06 waterfall | 2026-11-09 | partial | timings + legend + expand; no headers/cacheable yet |
| S07 history | - | not started | |

Data layer is FAKE (src/lib/data.ts): in-memory, simulated results, labelled as such in the UI.
Real layer = Postgres + Playwright worker (replica-backend). Not done: screenshots in clone-screens/, console/a11y pass.
Harder than expected: nothing yet; the real measurement worker and DNS-level SSRF guard are the big items.

## 2026-11-09 test pass
S01-S04, S06 now run on the real backend. 34/34 e2e passing (desktop 1440 + mobile 390), axe WCAG A/AA clean on S01 and S03, no console errors, no 5xx. Screenshots: replica/clone-screens/S03-desktop.png, S03-mobile.png. Bugs B01-B04 fixed, see bugs.md. Not started: S05 (breakdown charts), S07 (history).

## 2026-11-09 median of 3 runs
Worker runs 3 cold runs, saves each in test_runs, median run feeds grade and waterfall. UI: median tile with range, runs table, variance warning, progress 'Execucao n de 3'. 62/62 e2e (incl. median unit tests M1-M6, F01-R1, F01-R2). Real check: pt.wikipedia.org 953/884/914 ms, median 914.

## 2026-11-09 several addresses at once
Form takes up to 5 addresses; /comparar shows them in one table with live progress; worker runs 3 tests at a time; "Testar outro endereco" button on results and on the comparison page; first-response tile. 90/90 e2e. Real check: 5 government sites in 17 s, 3 overlapped.
