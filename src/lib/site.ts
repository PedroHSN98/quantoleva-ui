// Base URL of the deployed site, used by metadata, sitemap, robots and the share cards.
// Order: an explicit NEXT_PUBLIC_SITE_URL (set it for a custom domain), then Render's
// own RENDER_EXTERNAL_URL (set automatically on Render), then localhost for development.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.RENDER_EXTERNAL_URL ??
  "http://localhost:3000"
).replace(/\/+$/, "");
