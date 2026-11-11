import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The public, stable pages. Result pages are per-user and left out on purpose.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/comparar`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
