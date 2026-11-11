// Base URL of the deployed site, used by metadata, sitemap, robots and the share cards.
// Set NEXT_PUBLIC_SITE_URL in production (e.g. https://quantoleva.onrender.com).
// Falls back to localhost so links still resolve in development.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
