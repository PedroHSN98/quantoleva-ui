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
