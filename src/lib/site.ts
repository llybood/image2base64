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
   Routing: languages × pages.

   The site ships two tools in three languages, so a URL is a pair
   rather than a single value:

     (lang, page)  →  path

   The forward tool (image → base64) owns each language's root path
   because it is the older, better-established page. The reverse tool
   sits one segment below its language root:

     en   /                       /base64-to-image/
     de   /de/                    /de/base64-to-image/
     zh   /zh/                    /zh/base64-to-image/

   Three things must agree. Only the first is declared here; the other
   two are a filesystem fact and an intentional mirror, so neither can
   be derived from a value:

     1. LANGS / PAGES below — the two single lists (languages, pages).
        Every hreflang set, the sitemap, both switchers and the page
        head are generated from them.
     2. src/app/(en|de|zh)/ — the default language's pages sit directly
        in its route group; every other language is nested one directory
        deeper, named after its code.
     3. scripts/verify-seo.mjs — holds a deliberate copy of the routing
        table, so that the deliverable is not certified by the code that
        produced it. `npm run verify` asserts x-default follows
        DEFAULT_LANG and that each page's hreflang points at its own
        counterpart on the *same* page — the one pairing that a
        language-level map gets silently wrong.
   ============================================================ */

export const DEFAULT_LANG: Lang = "en";

/** Every language the site ships, default first. Order drives the
    language switcher, the hreflang set and the sitemap listing, so
    ordering only ever has to be corrected in this one place.

    Current order is en → de → zh: the default language leads, then the
    two secondary ones. Reordering is safe without touching anything
    else — hreflang sets and sitemap entries carry no ordering semantics,
    and `LANG_NAMES` below is keyed by code, not by position. */
export const LANGS: Lang[] = ["en", "de", "zh"];

/** Language names, each written in its own language.
    A language is the one label on a page that must NOT be translated:
    someone looking for German looks for "Deutsch", not for whatever the
    current page happens to call it. Shared by the header menu and the
    footer list so the two can never disagree. */
export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  zh: "中文",
  de: "Deutsch",
};

/* ------------------------------------------------------------
   Pages
   ------------------------------------------------------------ */

/** The two tools. `encode` = image → base64, `decode` = base64 → image. */
export type Page = "encode" | "decode";

/** Both tools, in the order the page switcher renders them. */
export const PAGES: Page[] = ["encode", "decode"];

/** Each language's root path. This is the `encode` page, and the parent
    directory of the `decode` page. */
export const LANG_ROOT: Record<Lang, string> = { en: "/", zh: "/zh/", de: "/de/" };

/** The single segment that distinguishes the reverse tool.
 *
 *  Deliberately identical in all three languages: `base64 to image` is
 *  searched in English even by non-English speakers, and a uniform slug
 *  keeps Chinese URLs free of percent-encoded characters. Changing it is
 *  this one line plus three directory renames. */
const DECODE_SLUG = "base64-to-image/";

/**
 * The path for one (language, page) pair — the only place a URL is
 * composed. Keeping it in one function is what stops a page from being
 * routed at one path and advertised at another.
 *
 * Note there is deliberately no `PATHS` map any more: a
 * language-keyed lookup cannot express "the same page in another
 * language", and every call site that silently resolved to the language
 * root would have been the exact bug this refactor exists to prevent.
 * Callers must now name the page they mean.
 */
export function pagePath(lang: Lang, page: Page): string {
  const root = LANG_ROOT[lang];
  return page === "encode" ? root : `${root}${DECODE_SLUG}`;
}

export const HTML_LANG: Record<Lang, string> = { zh: "zh-CN", en: "en", de: "de" };
export const OG_LOCALE: Record<Lang, string> = { zh: "zh_CN", en: "en_US", de: "de_DE" };

/** The other shipped languages, for switchers and OG alternateLocale. */
export function otherLangs(lang: Lang): Lang[] {
  return LANGS.filter((l) => l !== lang);
}

/**
 * hreflang code → path for one page, across every shipped language.
 *
 * Takes a page rather than only a language list, because the annotations
 * must pair *equivalent* pages: the reverse page's English counterpart is
 * "/base64-to-image/", never "/". A language-only map would tell a
 * crawler that the English version of the decoder is the encoder — the
 * classic multilingual pairing bug, and the reason this takes a page.
 *
 * Pass `withXDefault` when the caller needs the full annotation set, as
 * both the page head and the sitemap do.
 */
export function hreflangMap(page: Page, withXDefault = false): Record<string, string> {
  const map: Record<string, string> = Object.fromEntries(
    LANGS.map((l) => [HTML_LANG[l], pagePath(l, page)])
  );
  if (withXDefault) map["x-default"] = pagePath(DEFAULT_LANG, page);
  return map;
}

/**
 * hreflang set plus x-default for one page, made absolute. Used by the
 * sitemap, where every URL in an alternates block must be a full URL.
 */
export function absoluteHreflangMap(page: Page): Record<string, string> {
  return Object.fromEntries(
    Object.entries(hreflangMap(page, true)).map(([code, path]) => [code, abs(path)])
  );
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

/* ------------------------------------------------------------
   Target queries for the reverse tool (base64 → image).

   A separate set, not an extension: the two directions are searched as
   two distinct clusters, which is the whole reason the reverse tool gets
   its own page instead of a tab on the existing one. Two of these come
   straight from the Trends data that motivated the page — "convert
   base64 to image" (the fastest riser) and "base64 to image converter"
   (the top query) — and the rest are the natural variants around them.
   ------------------------------------------------------------ */

export const TARGET_QUERIES_EN_DECODE: TargetQuery[] = [
  {
    query: "convert base64 to image",
    probe: "convert base64 to image",
    carriedBy: "<title> + H1 + FAQ",
  },
  {
    query: "base64 to image converter",
    probe: "base64 to image converter",
    carriedBy: "<title> + H1 + meta description + FAQ",
  },
  {
    query: "base64 to image online",
    probe: "base64 to image online",
    carriedBy: 'Meta description + H2 "Base64 to image online, nothing uploaded"',
  },
  {
    query: "decode base64 to image",
    probe: "decode base64 to image",
    carriedBy: 'H2 "Decode base64 to image and get the bytes back" + FAQ',
  },
  {
    query: "base64 to png",
    probe: "base64 to png",
    carriedBy: 'H2 "Base64 to PNG, JPG, WebP or SVG" + format table',
  },
];

export const TARGET_QUERIES_ZH_DECODE: TargetQuery[] = [
  {
    query: "base64 转图片",
    probe: "base64 转图片",
    carriedBy: "标题 + H1 + 正文",
  },
  {
    query: "base64 转图片 在线",
    probe: "base64 转图片 在线",
    carriedBy: "H1 + H2 + 描述",
  },
  {
    query: "base64 解码",
    probe: "base64 解码",
    carriedBy: "H2 + 正文 + FAQ + 描述",
  },
  {
    query: "base64 转 png",
    probe: "base64 转 png",
    carriedBy: "H2 + 格式对照表",
  },
  {
    query: "base64 转图片 工具",
    probe: "base64 转图片 工具",
    carriedBy: "正文 + FAQ",
  },
];

export const TARGET_QUERIES_DE_DECODE: TargetQuery[] = [
  {
    query: "base64 zu bild",
    probe: "base64 zu bild",
    carriedBy: "Titel + H1 + Beschreibung",
  },
  {
    query: "base64 in bild umwandeln",
    probe: "base64 in bild umwandeln",
    carriedBy: 'H2 „Base64 in Bild umwandeln online – ohne Upload" + FAQ',
  },
  {
    /* Same compound problem as the forward page: German writes
       "Base64-Bild-Konverter" as one hyphenated word while the query is
       typed with spaces. `probe` is the literal on the page. */
    query: "base64 bild konverter",
    probe: "base64-bild-konverter",
    carriedBy: "Titel + H1 + FAQ",
  },
  {
    query: "base64 dekodieren",
    probe: "base64 dekodieren",
    carriedBy: 'H2 „Base64 dekodieren: was aus dem String wird" + FAQ',
  },
  {
    query: "base64 zu png",
    probe: "base64 zu png",
    carriedBy: 'H2 „Base64 zu PNG, JPG, WebP oder SVG" + Formattabelle',
  },
];

/* ============================================================
   Metadata
   ============================================================ */

/** Target queries by (page, language) — the shape every consumer wants. */
export const TARGET_QUERIES: Record<Page, Record<Lang, TargetQuery[]>> = {
  encode: { en: TARGET_QUERIES_EN, zh: TARGET_QUERIES_ZH, de: TARGET_QUERIES_DE },
  decode: {
    en: TARGET_QUERIES_EN_DECODE,
    zh: TARGET_QUERIES_ZH_DECODE,
    de: TARGET_QUERIES_DE_DECODE,
  },
};


/** <title> per (page, language). Budget: 66 display columns, with CJK
    glyphs counted double — the verifier measures it that way. */
export const TITLES: Record<Page, Record<Lang, string>> = {
  encode: {
    zh: "图片转 Base64 在线工具 - 图片 URL 转 Base64 与 Base64 编码",
    en: "Image to Base64 Converter - Convert Image URL to Base64 Online",
    de: "Bild zu Base64 Konverter - Bild in Base64 umwandeln online",
  },
  decode: {
    zh: "Base64 转图片在线工具 - Base64 解码还原 PNG/JPG 图片",
    en: "Base64 to Image Converter - Convert Base64 to PNG Online",
    de: "Base64 zu Bild Konverter - Base64 dekodieren zu PNG",
  },
};

/* Kept short enough not to be truncated in the SERP. Several of each
   page's five target queries are carried elsewhere on purpose — by an H2,
   a field label or the FAQ — because cramming all five in here would read
   as stuffing and still get cut off. */
export const DESCRIPTIONS: Record<Page, Record<Lang, string>> = {
  encode: {
    zh: "免费在线图片转 Base64 工具：本地图片或图片 URL 转 Base64，一键完成 Base64 编码，输出 Data URI 与纯 Base64，并显示原始大小与体积增幅。",
    en: "Free image to base64 converter — convert image to base64 online from a file, a paste or an image URL, and base64 encode PNG, JPG, GIF, WebP or SVG.",
    de: "Kostenloser Bild-zu-Base64-Konverter: Bild als Datei, per Einfügen oder über eine Bild-URL in Base64 umwandeln – Data URI und reiner Base64-String, ohne Upload.",
  },
  decode: {
    zh: "免费在线 Base64 转图片工具：粘贴 Base64 字符串或 Data URI 即可解码还原为 PNG、JPG、WebP、SVG 图片，可预览与下载，全程浏览器本地处理。",
    en: "Free base64 to image converter — paste a base64 string or a data URI, decode it back to a PNG, JPG, WebP or SVG file, and download it. Nothing is uploaded.",
    de: "Kostenloser Base64-zu-Bild-Konverter: Base64-String oder Data URI einfügen und zurück in eine PNG-, JPG-, WebP- oder SVG-Datei dekodieren – mit Vorschau, ohne Upload.",
  },
};

export const OG_ALT: Record<Page, Record<Lang, string>> = {
  encode: {
    zh: "Base64 Studio 工具界面：把图片转换为 Base64 与 Data URI，全程浏览器本地处理",
    en: "The Base64 Studio interface: an image to base64 converter that runs entirely in your browser",
    de: "Die Oberfläche von Base64 Studio: ein Bild-zu-Base64-Konverter, der vollständig im Browser läuft",
  },
  decode: {
    zh: "Base64 Studio 工具界面：把 Base64 字符串解码还原为图片并下载，全程浏览器本地处理",
    en: "The Base64 Studio interface: a base64 to image converter that turns a string back into a downloadable image",
    de: "Die Oberfläche von Base64 Studio: ein Base64-zu-Bild-Konverter, der einen String zurück in ein herunterladbares Bild verwandelt",
  },
};

const KEYWORDS: Record<Page, Record<Lang, string[]>> = {
  encode: {
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
  },
  decode: {
    zh: TARGET_QUERIES_ZH_DECODE.map((t) => t.query).concat([
      "base64 解码图片",
      "data uri 转图片",
      "base64 图片还原",
      "base64 转 jpg",
    ]),
    en: TARGET_QUERIES_EN_DECODE.map((t) => t.query).concat([
      "data uri to image",
      "base64 decoder",
      "base64 to jpg",
      "base64 image decoder",
    ]),
    de: TARGET_QUERIES_DE_DECODE.map((t) => t.query).concat([
      "data uri zu bild",
      "base64 entschlüsseln",
      "base64 zu jpg",
      "base64 bild",
    ]),
  },
};

export function buildMetadata(lang: Lang, page: Page): Metadata {
  const path = pagePath(lang, page);

  return {
    metadataBase: new URL(SITE_URL),
    title: TITLES[page][lang],
    description: DESCRIPTIONS[page][lang],
    keywords: KEYWORDS[page][lang],
    applicationName: BRAND,
    authors: [{ name: BRAND }],
    creator: BRAND,
    publisher: BRAND,
    alternates: {
      canonical: path,
      // Keyed by page as well as by language: the reverse page's English
      // counterpart is /base64-to-image/, so this cannot be derived from
      // the language alone. x-default names DEFAULT_LANG's copy of *this*
      // page — what a crawler offers a user whose language matches none
      // of the explicit entries.
      languages: hreflangMap(page, true),
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
      title: TITLES[page][lang],
      description: DESCRIPTIONS[page][lang],
      url: path,
      locale: OG_LOCALE[lang],
      // Open Graph has no concept of "the other locale" — it takes a
      // list, so a three-language site declares two alternates rather
      // than picking one arbitrarily.
      alternateLocale: otherLangs(lang).map((l) => OG_LOCALE[l]),
      images: [
        {
          url: "/og-cover.png",
          width: 1200,
          height: 630,
          alt: OG_ALT[page][lang],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLES[page][lang],
      description: DESCRIPTIONS[page][lang],
      images: [{ url: "/og-cover.png", alt: OG_ALT[page][lang] }],
    },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    category: "utilities",
  };
}
