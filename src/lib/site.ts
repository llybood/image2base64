import type { Metadata } from "next";

/* ============================================================
   Site-wide SEO configuration.

   Changing the domain is a one-line change: set SITE_URL in the
   environment (e.g. `.env.production`) and rebuild. No file in the
   tree hard-codes a hostname, so the language paths can never drift
   apart in the URLs they advertise.
   ============================================================ */

export const SITE_URL = (
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://example.com"
).replace(/\/+$/, "");

export const IS_PLACEHOLDER_DOMAIN = SITE_URL === "https://example.com";

export const BRAND = "Base64 Studio";

export const abs = (path: string) => `${SITE_URL}${path}`;

export type Lang = "zh" | "en" | "de";

/* ============================================================
   Language routing.

   DEFAULT_LANG is the language served at the site root, and therefore
   the target of the hreflang "x-default" annotation.

   Three things must agree. Only the first is declared here; the other
   two are a filesystem fact and an intentional mirror, so neither can
   be derived from a value:

     1. LANGS / PATHS below — LANGS is the single language list, and
        every hreflang set, the sitemap and the language switcher are
        generated from it. Adding a language starts and ends here.
     2. src/app/(en|zh|de)/ — the default language's page sits directly
        in its route group, every other language is nested one
        directory deeper, named after its code.
     3. scripts/verify-seo.mjs — holds a deliberate copy of PATHS and
        DEFAULT_LANG, so that the deliverable is not certified by the
        code that produced it. `npm run verify` asserts x-default
        follows DEFAULT_LANG on every page, so a half-finished language
        addition fails the check rather than shipping quietly.
   ============================================================ */

export const DEFAULT_LANG: Lang = "en";

/** Every language the site ships, default first. Order drives the
    language switcher, the hreflang set and the sitemap listing, so
    ordering only ever has to be corrected in this one place.

    Current order is en → de → zh: the default language leads, then the
    two secondary ones. Reordering is safe without touching anything
    else — hreflang sets and sitemap entries carry no ordering semantics,
    and `LANG_LABELS` below is keyed by code, not by position. */
export const LANGS: Lang[] = ["en", "de", "zh"];

/** Switcher labels. Codes rather than endonyms for the compact pill
    layout, except Chinese where the endonym is more legible. */
export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  zh: "中文",
  de: "DE",
};

export const PATHS: Record<Lang, string> = { en: "/", zh: "/zh/", de: "/de/" };
export const HTML_LANG: Record<Lang, string> = { zh: "zh-CN", en: "en", de: "de" };
export const OG_LOCALE: Record<Lang, string> = { zh: "zh_CN", en: "en_US", de: "de_DE" };

/**
 * hreflang code → path for every shipped language. Generated from LANGS
 * so the declared hreflang set can never drift from the language list —
 * a language that is routed but not advertised, or advertised but not
 * routed, is the classic multilingual indexing bug.
 *
 * Pass `withXDefault` when the caller needs the full annotation set, as
 * both the page head and the sitemap do.
 */
export function hreflangMap(withXDefault = false): Record<string, string> {
  const map: Record<string, string> = Object.fromEntries(
    LANGS.map((l) => [HTML_LANG[l], PATHS[l]])
  );
  if (withXDefault) map["x-default"] = PATHS[DEFAULT_LANG];
  return map;
}

/* ============================================================
   Target search queries.

   These are the five related queries this site is built to answer.
   They are not a `<meta keywords>` dump: each one maps to a real
   section of prose or a real FAQ entry, because the section is what
   actually ranks — the tag is not.

   `probe` is what the verification script looks for in the rendered
   HTML, so the claims below stay checkable rather than aspirational.
   ============================================================ */

export type TargetQuery = {
  /** The query as a user types it. */
  query: string;
  /** Lower-cased substring the verifier must find in the built page. */
  probe: string;
  /** Where it is carried on the page. */
  carriedBy: string;
};

export const TARGET_QUERIES_EN: TargetQuery[] = [
  {
    query: "convert image url to base64",
    probe: "convert image url to base64",
    carriedBy: 'H2 "Convert image URL to base64" + visible field label + FAQ',
  },
  {
    query: "convert image to base64",
    probe: "convert image to base64",
    carriedBy: 'Meta description + H2 "Convert image to base64 in three ways" + FAQ',
  },
  {
    query: "image to base64 online",
    probe: "image to base64 online",
    carriedBy: 'Meta description + H2 "Image to base64 online, with nothing uploaded"',
  },
  {
    query: "base64 encode",
    probe: "base64 encode",
    carriedBy: 'H2 "What base64 encode actually does to a file" + FAQ + spec tables',
  },
  {
    query: "image to base64 converter",
    probe: "image to base64 converter",
    carriedBy: "<title> + H1 + meta description + FAQ",
  },
];

export const TARGET_QUERIES_ZH: TargetQuery[] = [
  {
    query: "图片转 base64",
    probe: "图片转 base64",
    carriedBy: "标题 + H1 + 正文",
  },
  {
    query: "图片转 base64 在线",
    probe: "图片转 base64 在线",
    carriedBy: "H1 + H2 + 描述",
  },
  {
    query: "图片 url 转 base64",
    probe: "图片 url 转 base64",
    carriedBy: "H2 + 输入框可见标签 + FAQ",
  },
  {
    query: "base64 编码",
    probe: "base64 编码",
    carriedBy: "H2 + 正文 + FAQ + 描述",
  },
  {
    query: "图片 base64 转换",
    probe: "图片 base64 转换",
    carriedBy: "H2 + 正文",
  },
];

export const TARGET_QUERIES_DE: TargetQuery[] = [
  {
    query: "bild zu base64",
    probe: "bild zu base64",
    carriedBy: 'H2 „Bild zu Base64 konvertieren: drei Wege" + H1 + Beschreibung',
  },
  {
    query: "bild in base64 umwandeln",
    probe: "bild in base64 umwandeln",
    carriedBy: 'H2 „Bild in Base64 umwandeln online – ohne Upload" + Beschreibung',
  },
  {
    /* German compounds the noun, so the page writes "Bild-URL" while the
       query is typed with a space. The probe is the literal substring on
       the page; search engines treat the two as the same term. */
    query: "bild url zu base64",
    probe: "bild-url zu base64",
    carriedBy: 'H2 „Bild-URL zu Base64 umwandeln" + Feldlabel + FAQ',
  },
  {
    query: "base64 kodieren",
    probe: "base64 kodieren",
    carriedBy: 'H2 „Base64 kodieren: was dabei mit der Datei passiert" + FAQ + Spezifikationstabelle',
  },
  {
    query: "base64 konverter",
    probe: "base64 konverter",
    carriedBy: "<title> + H1 + Beschreibung + FAQ",
  },
];

/* ============================================================
   Metadata
   ============================================================ */

export const TITLES: Record<Lang, string> = {
  zh: "图片转 Base64 在线工具 - 图片 URL 转 Base64 与 Base64 编码",
  en: "Image to Base64 Converter - Convert Image URL to Base64 Online",
  de: "Bild zu Base64 Konverter - Bild in Base64 umwandeln online",
};

/* Kept short enough not to be truncated in the SERP. Two of the five
   target queries are carried elsewhere on purpose: "convert image url to
   base64" by the H2 and the visible field label, and "image to base64
   online" by the H2 — cramming all five in here would read as stuffing
   and still get cut off. The German set is held to the same budget:
   "bild in base64 umwandeln" is here, "bild url zu base64" and
   "base64 kodieren" are carried by their H2s and the FAQ. */
export const DESCRIPTIONS: Record<Lang, string> = {
  zh: "免费在线图片转 Base64 工具：本地图片或图片 URL 转 Base64，一键完成 Base64 编码，输出 Data URI 与纯 Base64，并显示原始大小与体积增幅。",
  en: "Free image to base64 converter — convert image to base64 online from a file, a paste or an image URL, and base64 encode PNG, JPG, GIF, WebP or SVG.",
  de: "Kostenloser Bild-zu-Base64-Konverter: Bild als Datei, per Einfügen oder über eine Bild-URL in Base64 umwandeln – Data URI und reiner Base64-String, ohne Upload.",
};

export const OG_ALT: Record<Lang, string> = {
  zh: "Base64 Studio 工具界面：把图片转换为 Base64 与 Data URI，全程浏览器本地处理",
  en: "The Base64 Studio interface: an image to base64 converter that runs entirely in your browser",
  de: "Die Oberfläche von Base64 Studio: ein Bild-zu-Base64-Konverter, der vollständig im Browser läuft",
};

const KEYWORDS: Record<Lang, string[]> = {
  zh: [
    "图片转 base64",
    "图片转 base64 在线",
    "图片 url 转 base64",
    "base64 编码",
    "图片 base64 转换",
    "data uri 生成",
    "png 转 base64",
    "svg 转 base64",
  ],
  en: TARGET_QUERIES_EN.map((t) => t.query).concat([
    "convert png to base64",
    "convert svg to base64",
    "data uri generator",
    "base64 image encoder",
  ]),
  de: TARGET_QUERIES_DE.map((t) => t.query).concat([
    "png zu base64",
    "svg zu base64",
    "data uri generator",
    "base64 bild",
  ]),
};

export function buildMetadata(lang: Lang): Metadata {
  const path = PATHS[lang];
  // Every shipped language except this one. Open Graph has no "the other
  // locale" — it takes a list, so a three-language site must declare two
  // alternates rather than picking one arbitrarily.
  const others = LANGS.filter((l) => l !== lang);

  return {
    metadataBase: new URL(SITE_URL),
    title: TITLES[lang],
    description: DESCRIPTIONS[lang],
    keywords: KEYWORDS[lang],
    applicationName: BRAND,
    authors: [{ name: BRAND }],
    creator: BRAND,
    publisher: BRAND,
    alternates: {
      canonical: path,
      // Generated from LANGS, with x-default pointing at DEFAULT_LANG:
      // it is what a crawler offers a user whose language matches none
      // of the explicit entries.
      languages: hreflangMap(true),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      siteName: BRAND,
      title: TITLES[lang],
      description: DESCRIPTIONS[lang],
      url: path,
      locale: OG_LOCALE[lang],
      alternateLocale: others.map((l) => OG_LOCALE[l]),
      images: [
        {
          url: "/og-cover.png",
          width: 1200,
          height: 630,
          alt: OG_ALT[lang],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLES[lang],
      description: DESCRIPTIONS[lang],
      images: [{ url: "/og-cover.png", alt: OG_ALT[lang] }],
    },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    category: "utilities",
  };
}
