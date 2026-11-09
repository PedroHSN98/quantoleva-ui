# Parity report: speed test clone vs Pingdom Website Speed Test

Date: 2026-11-09. Numbers are honest, not rounded up.

## Scores
| | score | note |
| --- | --- | --- |
| Feature parity | **84.4 / 100** | 19 scored features, all 10 must-haves done (4 out-of-scope rows left out on purpose) |
| Layout parity | **not measured** | `replica/screens/` is empty, so `imgdiff.py` had nothing to compare. Clone screenshots exist (`replica/clone-screens/S03-*.png`). |
| Overall | **84.4** (features only) | |

The feature matrix is based on the public home page and third-party walkthroughs, not on a hands-on run of the original, so "100%" would only mean parity with that description.

## By area (weakest first)
- breakdown 0 (3 features: size by type, by domain, requests by type, none built)
- form 80 (location selector partial)
- results 83.3 (permalink yes, error states yes, history no)
- waterfall 90 (headers not shown in UI)
- engine, summary, insights, security: 100

## Missing, in build order
1. [should] Content size by content type (S05 chart)
2. [should] Test location selector: only 1 real location (sa-east, runs on this machine). The other regions need real servers.
3. [should] Show request/response headers and cacheability in the expanded waterfall row (already stored in DB)
4. [could] Content size by domain
5. [could] Requests by content type
6. [could] Test history (S07, needs accounts)

Left out on purpose: monitoring products, Live Map, 70+ location network, API.

## Behaviour differences (from public descriptions, not side by side)
| flow | original does | clone does | fix or keep |
| --- | --- | --- | --- |
| F01 happy path | URL + location + Start (3 clicks) | same 3 steps; location is preselected, so the minimum is 2 (type URL, click) | keep, one fewer click |
| F01 grade | letter grade tied to a documented rule set | own rule set (6 rules), different numbers for the same site | keep; never compare scores across tools |
| F01 locations | many regions | 1 | build more workers or hide the selector until there are 2+ |
| F02 request details | headers and cacheability on expand | timings only | build (item 3) |
| errors | not verified | named errors: invalid URL, blocked, unreachable, timeout, rate limited | keep |
| waiting | not verified | polling with a "taking longer" hint after 45 s | keep |

## Quality gate
- Tests: 34/34 e2e passing (desktop and mobile), axe WCAG A/AA clean on home and result.
- Open bugs: S1 none, S2 none (B01-B04 fixed, see `bugs.md`).
- Known security gap for public launch (`backend.md`): DNS rebinding between our check and Chromium's own lookup; worker must run in a container with no route to internal networks.

## Verdict: **shippable by the pack's rule, with conditions**
All must-haves done, feature score above 80, no open S1/S2. Before putting it on the public internet, close the two security items above and decide what to do about the single location. It is **not yet better than the original**: nothing from `/replica-entrepreneur` is in, and the original's depth (more locations, history) is ahead.

## Top five next
1. Close the DNS rebinding gap and containerise the worker (launch blocker).
2. S05 content-size-by-type chart.
3. Show headers and cacheability in the expanded waterfall row.
4. Take reference screenshots of the public original (you, in your browser, 1440x900 and 390x844) into `replica/screens/`, then run the layout diff.
5. Run `/replica-entrepreneur` to find what users of the original complain about, which is where this clone can be better.
