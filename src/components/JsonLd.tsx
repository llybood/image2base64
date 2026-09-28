import { FAQ, plain } from "@/lib/faq";
import {
  BRAND,
  HTML_LANG,
  TITLES,
  abs,
  pagePath,
  type Lang,
  type Page,
} from "@/lib/site";

/**
 * Structured data.
 *
 * Deliberately omits aggregateRating: this tool has no rating data, and
 * inventing one breaches search-engine structured-data policy. FAQPage is
 * included because it is valid and machine-readable, though rich results
 * for FAQ are restricted to a small set of authoritative domains — the
 * value here is comprehension, not a SERP decoration.
 *
 * Every identifier is built from pagePath(lang, page) rather than a
 * literal. That is load-bearing now that the site has two pages per
 * language: with the old language-only lookup both tools' pages would
 * have emitted the same `#webapp` @id, which tells a crawler that two
 * different URLs describe one entity. Same reason the FAQ payload takes a
 * page — the two pages answer different questions, and duplicating one
 * FAQPage across two URLs is a structured-data smell.
 */

type LdCopy = {
  alternateName: string;
  description: string;
  featureList: string[];
  /**
   * Currency the free offer is quoted in. Follows the audience rather
   * than the hosting domain — a German page quotes EUR, the Chinese one
   * CNY — which is what a crawler comparing offers across the language
   * versions will read.
   */
  priceCurrency: string;
};

/*
 * Per-page, per-language payload. A lookup rather than nested ternaries:
 * with two pages and three languages a ternary chain has no readable
 * shape, and a missing branch would silently fall through to the wrong
 * prose instead of failing to compile the way a Record does.
 */
const LD_COPY: Record<Page, Record<Lang, LdCopy>> = {
  encode: {
    en: {
      alternateName: "Image to Base64 Converter",
      description:
        "A free online image to base64 converter. Convert image to base64 from a file, a paste or an image URL, and base64 encode JPG, PNG, GIF, WebP or SVG in the browser.",
      featureList: [
        "Convert image to base64 by file picker, drag-and-drop or clipboard paste",
        "Convert an image URL to base64, with explicit handling when CORS blocks the read",
        "Output both a Data URI and a raw base64 string",
        "One-click copy and .txt download",
        "English, Chinese and German interface",
        "Runs entirely in the browser — images are never uploaded",
      ],
      priceCurrency: "USD",
    },
    zh: {
      alternateName: "图片转 Base64 在线工具",
      description:
        "免费在线图片转 Base64 工具，支持本地图片与图片 URL 转 Base64，一键完成 Base64 编码，输出 Data URI 与纯 Base64。",
      featureList: [
        "本地图片点击选择、拖拽上传与剪贴板粘贴",
        "图片 URL 转 Base64，跨域受限时给出明确指引",
        "同时输出 Data URI 与纯 Base64 两种结果",
        "一键复制结果与下载 .txt 文件",
        "中文、英文与德文三语界面",
        "全程浏览器本地处理，图片不上传服务器",
      ],
      priceCurrency: "CNY",
    },
    de: {
      alternateName: "Bild zu Base64 Konverter",
      description:
        "Ein kostenloses Online-Werkzeug, um ein Bild in Base64 umzuwandeln. Wandle ein Bild aus einer Datei, per Einfügen oder über eine Bild-URL in Base64 um und kodiere JPG, PNG, GIF, WebP oder SVG direkt im Browser.",
      featureList: [
        "Bild zu Base64 per Dateiauswahl, Drag-and-drop oder Einfügen aus der Zwischenablage",
        "Eine Bild-URL zu Base64 umwandeln, mit ausdrücklichem Hinweis, wenn CORS das Lesen blockiert",
        "Ausgabe sowohl als Data URI als auch als reiner Base64-String",
        "Kopieren mit einem Klick und Download als .txt",
        "Deutsche, englische und chinesische Oberfläche",
        "Läuft vollständig im Browser — Bilder werden nie hochgeladen",
      ],
      priceCurrency: "EUR",
    },
  },
  decode: {
    en: {
      alternateName: "Base64 to Image Converter",
      description:
        "A free online base64 to image converter. Paste a base64 string or a data URI, decode it back into a PNG, JPG, WebP or SVG file, and download the bytes — all in the browser.",
      featureList: [
        "Convert base64 to image by pasting a raw string, a data URI, a CSS url() or an img src",
        "Decode base64 to image without any prefix — the real format is read from the magic bytes",
        "Download the decoded bytes as PNG, JPG, GIF, WebP, BMP, ICO, SVG or AVIF",
        "Live validation: empty input, illegal characters and oversized payloads are reported separately",
        "English, Chinese and German interface",
        "Runs entirely in the browser — the string is never uploaded",
      ],
      priceCurrency: "USD",
    },
    zh: {
      alternateName: "Base64 转图片在线工具",
      description:
        "免费在线 Base64 转图片工具：粘贴 Base64 字符串或 Data URI 即可解码还原为 PNG、JPG、WebP、SVG 图片，支持预览与下载，全程浏览器本地处理。",
      featureList: [
        "粘贴纯 Base64、Data URI、CSS url() 或 img src 均可还原为图片",
        "没有 Data URI 前缀时按字节头识别真实格式，不依赖声明",
        "解码结果可下载为 PNG、JPG、GIF、WebP、BMP、ICO、SVG 或 AVIF",
        "实时校验：空输入、非法字符与体积超限分别给出明确提示",
        "中文、英文与德文三语界面",
        "全程浏览器本地处理，字符串不上传服务器",
      ],
      priceCurrency: "CNY",
    },
    de: {
      alternateName: "Base64 zu Bild Konverter",
      description:
        "Ein kostenloses Online-Werkzeug, um Base64 wieder in ein Bild umzuwandeln. Füge einen Base64-String oder eine Data URI ein und dekodiere ihn zurück in eine PNG-, JPG-, WebP- oder SVG-Datei.",
      featureList: [
        "Base64 zu Bild durch Einfügen eines reinen Strings, einer Data URI, eines CSS-url() oder eines img-src",
        "Base64 dekodieren auch ohne Data-URI-Präfix – das echte Format wird an den Magic Bytes erkannt",
        "Dekodierte Bytes als PNG, JPG, GIF, WebP, BMP, ICO, SVG oder AVIF herunterladen",
        "Live-Prüfung: leere Eingabe, unzulässige Zeichen und zu große Nutzlast werden getrennt gemeldet",
        "Deutsche, englische und chinesische Oberfläche",
        "Läuft vollständig im Browser — der String wird nie hochgeladen",
      ],
      priceCurrency: "EUR",
    },
  },
};

export function JsonLd({ lang, page }: { lang: Lang; page: Page }) {
  const path = pagePath(lang, page);
  const copy = LD_COPY[page][lang];

  const webApp = {
    "@type": "WebApplication",
    "@id": `${abs(path)}#webapp`,
    name: `${BRAND} — ${TITLES[page][lang]}`,
    alternateName: copy.alternateName,
    url: abs(path),
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: "Image converter",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: HTML_LANG[lang],
    isAccessibleForFree: true,
    description: copy.description,
    featureList: copy.featureList,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: copy.priceCurrency,
    },
  };

  const faqPage = {
    "@type": "FAQPage",
    "@id": `${abs(path)}#faq`,
    inLanguage: HTML_LANG[lang],
    mainEntity: FAQ[page][lang].map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: plain(f.a) },
    })),
  };

  const data = {
    "@context": "https://schema.org",
    "@graph": [webApp, faqPage],
  };

  return (
    <script
      type="application/ld+json"
      // Our own static data — no user input reaches this payload.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
