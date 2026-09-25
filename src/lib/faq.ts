import type { Lang } from "./site";

/* ============================================================
   FAQ — the single source for both the rendered accordion and the
   FAQPage structured data, so the two can never disagree.

   Answers are written as plain text. Backticked spans are rendered as
   inline code on the page and stripped for the JSON-LD payload.
   ============================================================ */

export type Faq = { q: string; a: string };

const en: Faq[] = [
  {
    q: "How do I convert an image to base64?",
    a: "Drag an image onto the drop zone, click to browse for a file, or paste straight from the clipboard with Ctrl+V (Cmd+V on macOS). The converter reads the bytes locally and returns the base64 string immediately — there is no upload step and no queue, so the result appears as fast as the file can be read.",
  },
  {
    q: "How do I convert an image URL to base64?",
    a: "Paste the image address into the convert image URL to base64 field and press Load. The tool requests the bytes and encodes them directly, which also gives you an exact original size instead of an estimate. If the host does not permit cross-origin reads the browser blocks access; the converter then retries through a canvas element, and if that is blocked as well it tells you to download the image and use local upload instead.",
  },
  {
    q: "Is this image to base64 converter free, and does it work online?",
    a: "It is free, needs no account, and runs in any modern browser on desktop or mobile. Because every conversion happens inside the page there is nothing to install, no queue and no conversion quota.",
  },
  {
    q: "What does base64 encode do to the file size?",
    a: "Base64 encode maps every 3 bytes of binary data onto 4 ASCII characters, so the encoded text is roughly 33% larger than the original file. The data URI prefix adds a few characters more. The stats row above the result reports the measured figure for your specific image rather than a rule of thumb.",
  },
  {
    q: "Which image formats can I base64 encode?",
    a: "JPG, JPEG, PNG, GIF, WebP, BMP, SVG and ICO, up to 10 MB per file. SVG is read as text so the payload stays identical to the original markup, and the format shown in the result is detected from the file's magic bytes rather than trusted from the file name.",
  },
  {
    q: "What can I do with the Data URI once I have it?",
    a: "Paste it into an HTML src attribute, a CSS background-image, a markdown image, or a JavaScript string. It is most useful for small icons and logos that would otherwise cost an extra network request; keep it away from large photos, where the 33% overhead and the loss of browser caching usually outweigh the saved request.",
  },
  {
    q: "Are my images uploaded to a server?",
    a: "No. The conversion runs in browser memory and the bytes are never transmitted. You can confirm this in your browser's network panel — the only requests are for the page itself.",
  },
];

const zh: Faq[] = [
  {
    q: "怎样把图片转成 Base64？",
    a: "把图片拖入上传区、点击选择文件，或直接用 Ctrl+V（macOS 为 Cmd+V）粘贴剪贴板中的图片。工具在本地读取字节并立即返回 Base64 字符串，没有上传步骤也没有排队，文件读多快结果就出多快。",
  },
  {
    q: "怎样把图片 URL 转成 Base64？",
    a: "把图片地址粘贴到「图片 URL 转 Base64」输入框并点击加载。工具直接请求图片字节并编码，因此能给出精确的原始大小而非估算值。如果目标站点不允许跨域读取，浏览器会拒绝交出字节；此时工具会改用 canvas 方式重试，若仍被拦截，会明确提示你先下载图片再改用本地上传。",
  },
  {
    q: "这个图片转 Base64 在线工具收费吗？",
    a: "完全免费，无需注册，桌面端与移动端的现代浏览器都可以使用。所有转换都在页面内完成，没有安装步骤，也没有转换次数限制。",
  },
  {
    q: "Base64 编码会让文件变大多少？",
    a: "Base64 编码把每 3 字节二进制数据映射为 4 个 ASCII 字符，因此编码后的文本体积大约比原文件大 33%，再加上 data URI 前缀的少量字符。结果区上方的统计显示的是你这张图片的实测数值，而不是经验值。",
  },
  {
    q: "支持哪些图片格式？",
    a: "JPG、JPEG、PNG、GIF、WebP、BMP、SVG 与 ICO，单张上限 10 MB。SVG 按文本读取，编码结果与原始代码完全一致；结果中的格式来自文件头字节的实测识别，而不是文件名后缀。",
  },
  {
    q: "拿到 Data URI 之后可以用在哪里？",
    a: "可以直接放进 HTML 的 src 属性、CSS 的 background-image、Markdown 图片或 JavaScript 字符串。它最适合体积很小的图标与 Logo——省下一次网络请求；大图不建议内联，33% 的体积增幅和无法被浏览器单独缓存通常得不偿失。",
  },
  {
    q: "图片会被上传到服务器吗？",
    a: "不会。转换全程在浏览器内存中完成，字节不会被发送出去。你可以打开浏览器的网络面板确认：除了页面本身，没有任何额外请求。",
  },
];

export const FAQ: Record<Lang, Faq[]> = { zh, en };

/** Plain-text answer for structured data. */
export const plain = (s: string) => s.replace(/`/g, "");
