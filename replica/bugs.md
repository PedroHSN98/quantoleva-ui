# Bugs

Only reproduced issues. Severity: S1 data loss/security/core blocked, S2 feature broken no workaround, S3 broken with workaround or visibly wrong, S4 cosmetic.

## B01 (S2) Test waits forever when the default location has no worker
- **Steps:** open `/`, leave "Testar a partir de" on its default (first option, Frankfurt), enter `example.com`, click "Iniciar teste".
- **Expected:** a result, or a clear message.
- **Actual:** the test stays "Aguardando um espaço..." indefinitely. Only a `sa-east` worker existed, the list offered 3 locations. 24 tests piled up in the queue. Found by the e2e suite (result tests timed out at 30 s).
- **Evidence:** DB: 16-24 rows `queued`, `jobs.attempts = 0`, none locked.
- **Fix:** workers write `locations.worker_seen_at` (migration 003); the location list only offers locations with a worker seen in the last 3 minutes; if none, the form shows an alert and the button is disabled. Home page is `force-dynamic`.
- **Status:** fixed (commit below). Regression: F01-H1 and all result specs use the default location.

## B02 (S3) No feedback when the queue stalls
- **Steps:** worker stops after a test is created.
- **Actual:** the waiting message never changes.
- **Fix:** after 20 s the waiting screen adds "Está demorando mais que o normal" with a retry link.
- **Status:** fixed, not covered by an automated test (F01-E10).

## B03 (S3) Footer still says results are simulated
- **Steps:** open any page after the real worker was wired in.
- **Actual:** footer: "Resultados da fatia inicial são simulados." Found in the S03 mobile screenshot.
- **Fix:** replaced with a note that tests run in a real browser without cache.
- **Status:** fixed, asserted in F01-H1.

## B04 (S3) Small pages show "0.00 MB"
- **Steps:** test `example.com` (about 2 KB).
- **Actual:** "Tamanho da página: 0.00 MB".
- **Fix:** below 1 MB show KB with one decimal.
- **Status:** fixed, asserted in F01-H1.

## To check (not reproduced)
- Redirect chain ending on a private IP (F01-N7).
- Long-running page behaviour at the 45 s limit (F01-E9).
- Cookies in stored headers (X-2).
- Environment note: two worker processes ran side by side during the run and nothing broke; a worker started from the wrong folder silently failed (my launch mistake, not an app bug).
