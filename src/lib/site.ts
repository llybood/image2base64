import type { Metadata } from "next";

/* ============================================================
   Site-wide SEO configuration.

   Changing the domain is a one-line change: set SITE_URL in the
   environment (e.g. `.env.production`) and rebuild. No file in the
   tree hard-codes a hostname, so "/" and "/en/" can never drift
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

export type Lang = "zh" | "en";

export const PATHS: Record<Lang, string> = { zh: "/", en: "/en/" };
export const HTML_LANG: Record<Lang, string> = { zh: "zh-CN", en: "en" };
export const OG_LOCALE: Record<Lang, string> = { zh: "zh_CN", en: "en_US" };

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

/* ============================================================
   Metadata
   ============================================================ */

export const TITLES: Record<Lang, string> = {
  zh: "图片转 Base64 在线工具 - 图片 URL 转 Base64 与 Base64 编码",
  en: "Image to Base64 Converter - Convert Image URL to Base64 Online",
};

/* Kept short enough not to be truncated in the SERP. Two of the five
   target queries are carried elsewhere on purpose: "convert image url to
   base64" by the H2 and the visible field label, and "image to base64
   online" by the H2 — cramming all five in here would read as stuffing
   and still get cut off. */
export const DESCRIPTIONS: Record<Lang, string> = {
  zh: "免费在线图片转 Base64 工具：本地图片或图片 URL 转 Base64，一键完成 Base64 编码，输出 Data URI 与纯 Base64，并显示原始大小与体积增幅。",
  en: "Free image to base64 converter — convert image to base64 online from a file, a paste or an image URL, and base64 encode PNG, JPG, GIF, WebP or SVG.",
};

export const OG_ALT: Record<Lang, string> = {
  zh: "Base64 Studio 工具界面：把图片转换为 Base64 与 Data URI，全程浏览器本地处理",
  en: "The Base64 Studio interface: an image to base64 converter that runs entirely in your browser",
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
};

export function buildMetadata(lang: Lang): Metadata {
  const path = PATHS[lang];
  const other: Lang = lang === "zh" ? "en" : "zh";

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
      languages: {
        "zh-CN": PATHS.zh,
        en: PATHS.en,
        "x-default": PATHS.zh,
      },
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
      alternateLocale: OG_LOCALE[other],
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
