import type { MetadataRoute } from "next";
import {
  DEFAULT_LANG,
  LANGS,
  PAGES,
  absoluteHreflangMap,
  abs,
  pagePath,
  type Lang,
  type Page,
} from "@/lib/site";

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

  // One entry per (page, language) pair — six as the site stands.
  //
  // The outer loop is over pages, so each page's languages are listed
  // together and every entry carries that *page's* alternates block. The
  // alternates are built from absoluteHreflangMap(page), i.e. from the
  // same function that generates the page head: a decoder entry points at
  // the decoders in the other two languages, never at the encoders. This
  // is also the second of the two independent places a crawler looks for
  // the pairing, so building both from one source is what keeps them from
  // ever disagreeing.
  const entries: MetadataRoute.Sitemap = [];

  for (const page of PAGES) {
    const languages = absoluteHreflangMap(page);
    for (const lang of LANGS) {
      entries.push(entry(lang, page, languages, lastModified));
    }
  }

  return entries;
}

function entry(
  lang: Lang,
  page: Page,
  languages: Record<string, string>,
  lastModified: string
): MetadataRoute.Sitemap[number] {
  // The default language's copy of each page leads its group and carries
  // full priority; the others trail it. Ordering is a weak hint, but it
  // keeps the sitemap reading the way the page head declares alternates.
  const isPrimary = lang === DEFAULT_LANG;

  return {
    url: abs(pagePath(lang, page)),
    lastModified,
    changeFrequency: "monthly",
    priority: isPrimary ? 1 : 0.9,
    alternates: { languages },
  };
}
