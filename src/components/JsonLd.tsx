import { FAQ, plain } from "@/lib/faq";
import { BRAND, HTML_LANG, TITLES, abs, type Lang } from "@/lib/site";

/**
 * Structured data.
 *
 * Deliberately omits aggregateRating: this tool has no rating data, and
 * inventing one breaches search-engine structured-data policy. FAQPage is
 * included because it is valid and machine-readable, though rich results
 * for FAQ are restricted to a small set of authoritative domains — the
 * value here is comprehension, not a SERP decoration.
 */
export function JsonLd({ lang }: { lang: Lang }) {
  const webApp = {
    "@type": "WebApplication",
    "@id": `${abs("/")}#webapp`,
    name: `${BRAND} — ${TITLES[lang]}`,
    alternateName:
      lang === "en" ? "Image to Base64 Converter" : "图片转 Base64 在线工具",
    url: abs(lang === "zh" ? "/" : "/en/"),
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: "Image converter",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: HTML_LANG[lang],
    isAccessibleForFree: true,
    description:
      lang === "en"
        ? "A free online image to base64 converter. Convert image to base64 from a file, a paste or an image URL, and base64 encode JPG, PNG, GIF, WebP or SVG in the browser."
        : "免费在线图片转 Base64 工具，支持本地图片与图片 URL 转 Base64，一键完成 Base64 编码，输出 Data URI 与纯 Base64。",
    featureList:
      lang === "en"
        ? [
            "Convert image to base64 by file picker, drag-and-drop or clipboard paste",
            "Convert an image URL to base64, with explicit handling when CORS blocks the read",
            "Output both a Data URI and a raw base64 string",
            "One-click copy and .txt download",
            "Chinese and English interface",
            "Runs entirely in the browser — images are never uploaded",
          ]
        : [
            "本地图片点击选择、拖拽上传与剪贴板粘贴",
            "图片 URL 转 Base64，跨域受限时给出明确指引",
            "同时输出 Data URI 与纯 Base64 两种结果",
            "一键复制结果与下载 .txt 文件",
            "中英文双语界面",
            "全程浏览器本地处理，图片不上传服务器",
          ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: lang === "en" ? "USD" : "CNY",
    },
  };

  const faqPage = {
    "@type": "FAQPage",
    "@id": `${abs(lang === "zh" ? "/" : "/en/")}#faq`,
    inLanguage: HTML_LANG[lang],
    mainEntity: FAQ[lang].map((f) => ({
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
