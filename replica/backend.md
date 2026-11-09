# Backend status

Scope: anonymous tool. Auth, payments, email: not needed, not built.

## Done
- Postgres 16 via `docker-compose.yml` (dev only, port 5433). `npm run db:up`, `npm run db:migrate`.
- Migrations in `migrations/` (001 schema + seed locations, 002 rule name), applied by `scripts/migrate.ts`, tracked in `schema_migrations`.
- Data layer `src/lib/data.ts` on Postgres (replaced the fake one, same signatures).
- Job queue in the `jobs` table, claimed with `FOR UPDATE SKIP LOCKED`, stale lock after 8 min (longer than the longest run), 3 attempts, reaper fails dead tests.
- Worker `worker/` (`npm run worker`): Playwright Chromium, per-request timings from CDP, SSRF guard, saves in one transaction, idempotent (`on conflict do nothing`).
- Verified with real runs: example.com (A, 2 requests), pt.wikipedia.org (47 requests, redirect shown), `localtest.me` (resolves to 127.0.0.1 -> blocked_target), unknown domain (unreachable), 6th test in 10 min -> HTTP 429.

## Env
`.env.example` lists DATABASE_URL, IP_HASH_SECRET, WORKER_LOCATION. Real values only in `.env.local` (git-ignored).

## Security checklist
- [x] secrets only in env vars, `.env*` ignored, nothing in client bundle
- [x] input validated on server (URL checks, location whitelist). zod installed but not used yet
- [ ] authorisation: n/a (anonymous; results readable by unguessable 10-char id)
- [x] rate limit on test creation (hashed IP, 5 per 10 min)
- [ ] rate limit is per proxy header `x-forwarded-for`: behind a real proxy/CDN, trust only its header
- [x] sensitive headers (cookie, set-cookie, authorization) stripped before saving
- [x] no user data in logs beyond tested URL
- [x] webhooks/uploads: none
- [ ] DNS rebinding: name is resolved by us, then again by Chromium. Fix before public launch: pin resolved IP or run the worker with an egress firewall that blocks private ranges
- [ ] worker must run in a container with no route to internal networks / metadata endpoints in production
- [ ] cleanup job (delete tests older than 30 days) not written
- [ ] global concurrency cap: worker is single-threaded (1 test at a time), so effectively capped
- [ ] backups: dev DB only; enable host backups at deploy
- [ ] timeout error path (5 min) not exercised; 75 s slow page verified in isolation only
- [ ] `npm audit` run (see build log)
- [ ] privacy policy: lists host, database provider

## Runs (2026-11-09)
- Each test runs the browser 3 times in a row (cold). `test_runs` stores every run; the median run (by load time; of an even count, the faster middle one) feeds the grade, rules and waterfall. Migration 004.
- A later failed run keeps the finished ones; a failed first run fails the test. One shared 10 minute budget for all runs, 5 minutes max per run, lock stale after 15 minutes.

## Not built (not in scope)
Auth, accounts and test history, Stripe, email, third-party integrations.
