# Pricing

Date read: **2026-11-09**. Prices change; check each vendor page before relying on a number.

## Competitors' public pricing
The vendors' own pages did not show usable prices to my reader (Pingdom's calculator rendered blank, GTmetrix returned 403, DebugBear's page had no plan text). The numbers below come from **secondary sources** and must be confirmed on the vendor pages by you.

| product | what | price as reported | source | confidence |
| --- | --- | --- | --- | --- |
| Pingdom speed test | the free tool this clone studies | free, no account (users say so: "doesn't require creating an account") | https://tools.pingdom.com | high |
| Pingdom Synthetic Monitoring | paid uptime + page speed monitoring, 10 uptime checks, 1 advanced check | about US$18/month monthly, about US$198/year (US$16.50/month) | https://hyperping.com/blog/pingdom-pricing, https://cubeapm.com/blog/pingdom-pricing-and-review/ | medium (other sources show lower, older numbers) |
| GTmetrix | PRO plans, billed yearly | Lite US$4.99, Core US$9.99, Advanced US$24.99, Expert US$49.99 per month; monthly billing reported higher (Lite 5.99, Core 11.99, Advanced 29.99, Expert 59.99) | https://gtmetrix.com/pricing/ (snippet), https://www.itqlick.com/gtmetrix, https://www.getapp.com/all-software/a/gtmetrix/ | medium |
| DebugBear | monitoring, no free plan reported, trial reported | **unclear**: sources say US$49, US$79 or US$125 for the entry plan | https://www.softwareadvice.com/website-monitoring/debugbear-profile/, https://toolradar.com/tools/debugbear/pricing | low |

## What reviewers said about price and billing
- About the speed test: nothing. Sample is 11 quotes (see `fixes.md`), none mention price. They praise that it needs no account.
- About Pingdom's paid monitoring (Trustpilot, 7 reviews total, 3 readable, not copied as quotes): one says sales never answered a request to change payment details, one says the account was suspended without a refund. This is thin (2 reviews) and about a product this clone does not offer. It still points to what to promise: a human answers billing questions, and no suspension without a refund.

## Recommendation
**Launch free only.** The thing users like is "no account", and none of the paid-plan features exist yet (history, scheduled tests, regions). Charging now would sell what is not built.

When something paid exists, a proposal to validate with the first 10 users, not a fixed price:

| tier | for | includes | price to test |
| --- | --- | --- | --- |
| Grátis | anyone | what exists today, 5 tests per 10 minutes, no account | US$0 |
| Pro | freelancers and small sites | history, scheduled tests, 3 runs with range, more locations | around US$9/month, or US$90/year (2 months free). In the GTmetrix Lite to Core band, below Pingdom's paid monitoring. |
| Equipe (later) | agencies | shared reports, more pages | decide after the first 10 conversations |

Billing promises to build in (from the thin evidence above): cancel in one click, a renewal email before each charge, no suspension without a refund, a human reply to billing questions.

## Stripe (you create these, in test mode first)
Not built: no payments code exists, and `replica/backend.md` lists payments as out of scope. When Pro exists: one product "Pro" with two recurring prices (monthly, yearly), Customer Portal on, webhooks for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
