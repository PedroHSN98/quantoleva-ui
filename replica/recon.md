# Recon map: Pingdom Website Speed Test (tools.pingdom.com)

Platform: web. Owner of clone: user's own business. Sources: public only (no account needed, tool is free).

## Scope
Core loop: enter URL, pick test location, run test, read result report (grade, load time, size, requests, waterfall, breakdowns, recommendations).
Out of scope: Pingdom paid monitoring (uptime, RUM, transaction, alerting), Live Map, API, mobile apps.

## Sources
| source | url | gives |
| --- | --- | --- |
| tool home | https://tools.pingdom.com/ | form, legends (state colors, content types, response codes) |
| help center | https://help.pingdom.com | metric definitions, grade rules |
| third-party walkthroughs | kinsta.com/blog/pingdom-speed-test, webscoot.io/blog/pingdom-website-speed-test, supporthost.com/pingdom | result page layout |
| pricing | https://www.pingdom.com/pricing | what is gated (not needed for free tool) |

## Screens
| ID | screen | route | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S01 | Home / test form | / | start a test | URL input, "Test from" select, Start test button, info sections, legends | empty, invalid URL, loading |
| S02 | Test in progress | /result/... | wait for test | progress/spinner | running, failed (unreachable, timeout) |
| S03 | Result summary | /result/{id} | headline numbers | performance grade (letter + 0-100), load time, page size, requests, test location/time, share link | ok, partial, error |
| S04 | Improve page performance | section of S03 | recommendations | rule list with per-rule score | all-pass, many failures |
| S05 | Content size by type / domain / requests by type | section of S03 | breakdowns | pie/bar charts, tables | - |
| S06 | File requests (waterfall) | section of S03 | per-request timeline | rows: file, size, state-colored bars (DNS, SSL, Connect, Send, Wait, Receive, Blocked), content-type icon, status-code dot, expandable headers | collapsed, expanded, sorted/filtered |
| S07 | Test history (inferred) | /history | past tests | list of tests | empty, filled |
| S08 | Marketing chrome | header/footer | nav, trial CTA | out of scope for clone |

## Flows
F01 Run a test: S01 -> S02 -> S03 (click count: type URL, pick location, click Start = 3)
 edge: bad URL, site blocks bot, redirect chain, very large page, timeout
F02 Inspect a slow file: S03 -> S06 (expand row to see headers, cacheable)
F03 Fix a problem: S03 -> S04 (read recommendation)
F04 Share a result: S03 -> copy permalink

## Components
URL input, location select, primary button, grade badge, stat tiles, donut/bar charts, data table, waterfall row with stacked timing bar, legend chips, content-type icons, status-code dots, expandable row, toast/error banner.

## Inferred data model (guesses marked)
Test: id, url, location_id, status (queued|running|done|failed), created_at, grade, score, load_ms, page_bytes, request_count  (high)
Request: id, test_id, url, domain, content_type, status_code, size_bytes, start_ms, dns_ms, ssl_ms, connect_ms, send_ms, wait_ms, receive_ms, blocked_ms, req_headers, res_headers (json), cacheable  (high, from legends + guides)
Rule: key, name, score, advice, test_id  (medium; YSlow-style rules, guess)
Location: id, name, region  (medium; actual list not visible in public text)

## Hard parts
1. Real page load measurement needs a headless browser (Playwright/Chromium) capturing HAR-like timings.
2. Multiple test locations = servers/workers in several regions (start with 1-3).
3. Grade/recommendation rules: Pingdom's exact formula is not public; write original rules (e.g. Lighthouse-style or YSlow public rules).
4. SSRF protection: users submit arbitrary URLs, block private IPs.

## Cannot clone
Pingdom's 70+ polling location network, brand, SolarWinds content, its paid monitoring product and customer data.

## Size
S-M. Screens 6, flows 4, entities 4. Thin slice: one location, summary + waterfall.
