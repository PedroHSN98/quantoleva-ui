# Fixes: what users of the original say, and how to be better

## Sample size, stated plainly
**11 quotes from 9 comments, 2 sources** (Hacker News through its official Algolia API; one WordPress.org support thread). No star ratings exist for any of them. This supports a **direction, not a ranking**. Every quote is an exact substring of the source text, with its link, in `replica/reviews.csv`; `replica/feedback.md` is the tool's output.

Not reached, so not counted:
- Trustpilot (3 of 7 reviews visible; two are about billing and support for the paid monitoring product, one is a 5-star about the speed test. The page tool only returned shortened text, so none were copied as quotes).
- G2, Capterra, Reddit (no API credentials, review sites bot-walled), App Store and Google Play (the original is a website, no listing).
- The original's changelog, so some of these complaints may already be fixed. Most comments date from 2016-2020.

Also: HN comments mostly *use* the tool to measure other sites. Complaints about the tool itself are few. The tool's own default theme ranking in `feedback.md` is generic and mislabels two quotes; I read the quotes by hand and use the themes below.

## 1. What they hate (about the tool)
1. **The result depends on where the test runs, and the default is not where you are.** 4 comments, 2 sources.
   - "Maybe it's me but their test seems to hate sites hosted in europe. (Strato, Germany)" https://news.ycombinator.com/item?id=13654915
   - "By default pingdom checks loading speed from USA. If you server is in UK, change setting in Pingdom to Amsterdam and it suppose to load faster" https://wordpress.org/support/topic/speed-test-high-grade-low-speed/
   - Also https://news.ycombinator.com/item?id=13639879 and https://news.ycombinator.com/item?id=13902333 (test server location changes the outcome).
2. **The numbers do not feel trustworthy.** 3 comments, 1 source.
   - "The backend number is nice, really, but the quoted load time by the tool isn't. My jenkins loads almost as fast, (and according to the tool faster than HN), and isn't even hosted in a DC." https://news.ycombinator.com/item?id=13249279
   - "Faster than 99% of sites, 0B and still only 83/100. I think most of these metrics are a bit off..." https://news.ycombinator.com/item?id=13654915
   - "...which may be different from the in-browser experience:" https://news.ycombinator.com/item?id=32141582
3. **The score gives little to act on (thin, 1 comment).** "66(mobile)/77(desktop) of 100 from Google PageSpeed Insights (with more useful hints what to fix) and 75/100 from tools.pingdom.com ..." https://news.ycombinator.com/item?id=13654915
4. **The tool may be served a different page (thin, 1 comment).** "The hilarous thing is that if you put in https://www.reddit.com to pingdom's measurement tool, reddit returns the old site layout." https://news.ycombinator.com/item?id=24414306

## 2. What is missing
Nobody asks for a feature by name. What the comments imply: pick the region (the WordPress reply tells people to change it), see hints on what to fix, compare regions.

## 3. What is unsolved
Site owners outside the US, who get a US-flavoured result and no way to see "what do my visitors get". Evidence: theme 1 above (thin: 4 comments).

## What to keep (users like it)
- "I use Pingdom's speed test. I like that it doesn't require creating an account and gives some useful tips" https://news.ycombinator.com/item?id=17192511
- "...gives a real world performance metric (actual load times)" https://news.ycombinator.com/item?id=13370173

So: no sign-up, real browser, per-file view. Do not break these.

## Fix plan (evidence x cost)
| # | change | size | skill | evidence |
| --- | --- | --- | --- | --- |
| 1 | Run the test 3 times, show the median and the range, say why times vary | S | replica-build | theme 2 (3 comments) |
| 2 | Compare regions side by side (needs 2+ real workers) and show the location on every result | M (infra: L) | replica-backend | theme 1 (4 comments) |
| 3 | Explain each score: why this number, which files cause it, one concrete fix | M | replica-build | theme 3 (thin) |
| 4 | Desktop / mobile profile (user agent, viewport) and a note when the server returns a different page | S | replica-build | theme 4 (thin) |
| 5 | Keep it free and account-free | - | - | "doesn't require creating an account" |
Pricing complaints: none found about the speed test. Nothing for `/replica-launch` yet.

Rows added to `replica/features.csv` with `original = no`.

**Status 2026-11-09:** fix 1 (3 runs, median and range) is built. Fixes 2, 3 and 4 are not.

## Positioning (three options)
```
A. For site owners outside the US who do not trust one number from one place,
   {{your app}} tests from where your visitors are, runs it three times and shows the range.
   Evidence: location theme, 4 comments across 2 sources; trust theme, 3 comments (thin).

B. For people who fix slow pages, {{your app}} tells you which file costs the most and what to change.
   Evidence: 1 comment (thin).

C. For anyone who just wants a quick check, {{your app}} needs no account and shows every file.
   Evidence: 2 positive comments. A strength of the original too, so no reason to switch.
```
**Recommend A**, with a warning: it needs real servers in more than one region to be true. Until then, say what exists (one location) and lead with the 3-run range, which works today. Do not put the original's name in the app name, ads or listing.

Next: `/replica-brand`, but first collect more evidence if you plan to bet money on this angle (aim for 100+ reviews across 3 sources, for example by reading Trustpilot, G2 and Reddit yourself and pasting rows into `reviews.csv`).
