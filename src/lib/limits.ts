/** Shared limits, so the API, the form and the landing text never disagree. */
export const MAX_URLS_PER_SUBMIT = 5;
export const DEFAULT_RATE_LIMIT = 15; // tests per client per 10 minutes (RATE_LIMIT_MAX overrides)
// An empty or invalid RATE_LIMIT_MAX (for example copied from .env.example) falls back to the default.
export const rateLimit = () => Number(process.env.RATE_LIMIT_MAX) || DEFAULT_RATE_LIMIT;
