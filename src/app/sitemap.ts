import type { MetadataRoute } from "next";
import { DEFAULT_LANG, LANGS, PATHS, abs, hreflangMap, type Lang } from "@/lib/site";

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
  // Built from the same LANGS-derived map the head uses, then made
  // absolute — so the sitemap cannot advertise a language the site does
  // not route, or omit one it does.
  const languages = Object.fromEntries(
    Object.entries(hreflangMap(true)).map(([code, path]) => [code, abs(path)])
  );

  // One entry per shipped language. The default language is listed first
  // and carries full priority; the ordering is a weak hint to crawlers,
  // but it keeps the sitemap reading in the same order as the page head
  // declares its alternates.
  const entry = (lang: Lang): MetadataRoute.Sitemap[number] => ({
    url: abs(PATHS[lang]),
    lastModified,
    changeFrequency: "monthly",
    priority: lang === DEFAULT_LANG ? 1 : 0.9,
    alternates: { languages },
  });

  return LANGS.map(entry);
}
