import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";

// Every public, indexable page. Deliberately absent: /request-access and
// /subscribe (the investor flow, marked noindex on their own pages) and
// everything under /admin. Add a page here when it is added to the site.
const PAGES = [
  "/",
  "/invest",
  "/about",
  "/our-investment-vehicles",
  "/stage-point-fund",
  "/stage-point-master",
  "/leadership",
  "/management-bios",
  "/advisory-board",
  "/contact",
  "/borrower-loan-intake-form",
  "/terms-and-conditions",
];

// No lastModified: the pages are static and there is no honest per-page
// timestamp to report, and a wrong one is worse than none.
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({ url: path === "/" ? SITE_URL : `${SITE_URL}${path}` }));
}
