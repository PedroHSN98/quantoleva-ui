# Architecture: speed test clone

## Stack
| layer | choice | why |
| --- | --- | --- |
| web app | Next.js (App Router) + TypeScript | one codebase for UI and API, easy Vercel deploy |
| styling | Tailwind, tokens from replica-design | |
| database | Postgres on Neon (or Supabase) | one DB, also used as the job queue |
| ORM | Drizzle | typed, SQL-close |
| measurement worker | Node + Playwright (Chromium) in Docker on Fly.io or Render | Chromium cannot run in Vercel functions; one worker per location |
| jobs | Postgres table + `FOR UPDATE SKIP LOCKED` | no extra service |
| auth | none in MVP (anonymous); Auth.js later for history | |
| charts | plain SVG or Recharts | |
| hosting | Vercel (web) + Fly.io (workers) | |

No microservices: two deployables, web and worker, sharing the DB.

## Schema
See `replica/schema.sql`: 5 tables (locations, tests, requests, rule_results, jobs).
Constraints: status/enum checks, FKs with explicit on-delete, indexes on every FK and on (status, created_at) for the queue. Times are timestamptz.
Access: anonymous reads by unguessable `public_id`; all writes through server code with the service role. Per-query authorisation when accounts arrive.

## API
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET / | home form page | anyone | - | S01 | F01 |
| GET /api/locations | list active locations | anyone | - | [{slug,name,region}] | F01 |
| POST /api/tests | validate URL, create test + job | anyone, rate limited | {url, location} | {public_id} | F01 |
| GET /api/tests/{public_id} | status + summary + rules | anyone with id | - | test, rules | F01, F03 |
| GET /api/tests/{public_id}/requests | waterfall rows | anyone with id | - | requests[] | F02 |
| GET /result/{public_id} | result page (S02-S06), polls status | anyone with id | - | page | F01-F04 |
| POST /internal/worker/claim | worker claims job | worker token | location | job | - |
| POST /internal/worker/complete | worker posts results | worker token | results | 204 | - |

(Workers may connect straight to the DB instead; then the two internal routes disappear.)

Jobs: stale-job reaper (every minute: unlock jobs locked > 2 min, fail after 3 attempts); cleanup (daily: delete tests older than 30 days).
No third-party APIs, no webhooks.

## Parts that bite
- **SSRF:** resolve DNS, reject private, loopback, link-local and metadata IPs (v4 and v6), re-check on every redirect and sub-request, http/https only, ports 80/443. Run Chromium in a locked-down container with no internal network access.
- **Abuse and cost:** rate limit per IP hash (e.g. 5 tests per 10 min), global concurrency cap, 60 s hard timeout, max body size, max requests per page.
- **Measurement accuracy:** per-request timings from CDP/Playwright network events; fixed viewport, cold cache, documented throttling. Results vary, so show test time and location.
- **Grading:** original rule set (compression, cache headers, request count, image weight, redirects, blocking scripts), each scored 0-100, weighted to a grade. Not Pingdom's formula.
- **Idempotency:** worker completion safe to run twice (upsert on (test_id, seq)).
- **Races:** job claim via SKIP LOCKED; a test finishes once (status check in the update).
- **Privacy:** hashed IPs only; strip Cookie, Set-Cookie and Authorization headers before saving.
- **Time zones:** store UTC, render in the viewer's locale.

## Build order
1. **Vertical slice** (S01, S02, S03 summary, S06 basic waterfall): tables locations/tests/requests/jobs; routes POST /api/tests, GET /api/tests/{id}, GET /result/{id}; one local Playwright worker; one location. Ugly is fine.
2. **Must-haves:** SSRF guard, rate limit, error states, grade and rules (rule_results), waterfall state colors, full metrics.
3. **Should-haves:** location selector with 2-3 regions, content-type icons and status dots, expandable headers, permalink polish, size-by-type chart (S05), recommendations (S04).
4. **Could-haves:** by-domain and requests-by-type charts, test history with accounts (S07).
5. **Fixes** from /replica-entrepreneur once it has run.
