import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";

// Crawlers may read the whole public site; the staff admin and the API routes
// are not for them. (The investor flow pages keep themselves out of the index
// with a noindex tag instead, which only works if crawlers are allowed to see
// the page, so they are not disallowed here.)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
