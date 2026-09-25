import type { MetadataRoute } from "next";
import { PATHS, abs } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Build-date stamp using local calendar values.
 * `toISOString().slice(0,10)` reads the UTC date and rolls back a day for
 * builds run in the early morning at UTC+8, so it is avoided here.
 */
function buildDate(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = buildDate();

  // hreflang annotations live in the sitemap as well as in the page head:
  // they are the two independent places a crawler looks for the pairing.
  const languages = {
    "zh-CN": abs(PATHS.zh),
    en: abs(PATHS.en),
    "x-default": abs(PATHS.zh),
  };

  return [
    {
      url: abs(PATHS.zh),
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages },
    },
    {
      url: abs(PATHS.en),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages },
    },
  ];
}
