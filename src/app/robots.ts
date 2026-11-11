import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Let search engines crawl the site, but keep the API out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
