# Launch plan

## Store listing
Not applicable: this is a website, not an App Store or Google Play app, so `listing.json` and `listing.py` were not used. The page title and description are set in `src/app/layout.tsx`.

## Do not launch publicly until
Blockers, from `replica/backend.md` and the parity report:
1. DNS rebinding gap closed, and the worker in a container with no route to internal networks.
2. The name checked: INPI, USPTO, EUIPO, WIPO, stores, handles, a lawyer (see `brand.md`). Do not register domains before.
3. Analytics and error tracking live (none yet), privacy policy and support page published (none yet), a cleanup job for old results (not written).
4. The result-retention promise decided. The page makes none today.
5. Project folder and any repository renamed (still `replica-pingdom`).

## The honest position today
What exists: real browser, every file, a grade with six explained rules, no account, one location. The angle in `fixes.md` (where your visitors are, 3 runs with a range) needs two things not built: more than one worker region, and 3-run medians. The 3-run median is now built (2026-11-09). Multiple real regions are still missing, so lead with the range and be plain that there is one location. Until then, lead with what is true: no account, every file, honest about variation.

## Before launch
- A short beta list. For a free tool, 10 to 20 real users is enough: ask for permission before using any quote.
- Measure: tests started, tests completed, failures by error code (the DB already has it), time to result.

## Where the original's unhappy users talk
Only what the research found (small sample): Hacker News threads (https://news.ycombinator.com/item?id=13654915 and others in `reviews.csv`) and a WordPress.org support thread (https://wordpress.org/support/topic/speed-test-high-grade-low-speed/). Reddit, G2 and Capterra were **not read**, so no community list exists yet. Read them yourself before choosing where to post.

## Post
A Show HN or Product Hunt post that leads with the fix: "A page speed test that tells you where it ran, and how much the number moves between runs." Post it only once the 3-run median exists, otherwise the first reply will be "where is the range?". Do not name the original in the title. A comparison page naming it is a question for a lawyer in your country.

## First 10 users, by hand
Web developers and freelancers whose clients are outside the US. You have to find them (the research does not name any). Ask one question: "What did you do the last time a page felt slow?". Write down their words and add them to `reviews.csv`.
