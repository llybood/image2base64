import type { Lang } from "./site";

/* ============================================================
   UI strings for the tool itself.

   Long-form landing copy lives in components/sections/, not here —
   this dictionary is only for interface text, where a missing or
   mismatched key would be a visible bug.

   `en` is declared as Record<keyof typeof zh, string>, so TypeScript
   fails the build if the two languages ever drift out of sync.
   ============================================================ */

const zh = {
  brand: "Base64 Studio",
  langSwitchLabel: "语言 / Language",
  langZh: "中文",
  langEn: "EN",

  noscriptTitle: "本工具需要启用 JavaScript 才能运行。",
  noscriptBody:
    "图片转 Base64 的全部转换都在你的浏览器内完成，因此必须启用 JavaScript。开启后刷新本页即可使用。",

  heroTitle: "图片转 Base64 在线工具",
  heroSubtitle:
    "本地图片或在线图片 URL，一键完成 Base64 编码，生成 Data URI 与纯 Base64 —— 全程在浏览器本地完成，图片不会上传服务器。",
  heroCtaPrimary: "粘贴图片或按 Ctrl+V",
  heroCtaSecondary: "查看支持的格式",

  uploadTitle: "选择图片",
  uploadCountZero: "0 张",
  uploadCount: "{n} 张",
  dropzoneAriaDesc: "拖拽或点击选择图片文件",
  dropTitle: "拖拽图片到此处，或点击选择文件",
  dropHint: "支持 JPG · PNG · GIF · WebP · SVG，也可直接 Ctrl+V 粘贴",
  dropTitleActive: "松开鼠标即可添加图片",
  pickButton: "点击选择图片",
  urlLabel: "图片 URL 转 Base64",
  urlPlaceholder: "粘贴在线图片地址 https://example.com/pic.png",
  loadButton: "加载",
  loadingButton: "加载中…",
  urlNote:
    "提示：在线图片需目标站点允许跨域读取；若因 CORS 限制失败，请先下载图片再改用本地上传。",

  resultTitle: "转换结果",
  badgeIdle: "等待选择图片",
  badgeDone: "转换完成",
  badgeError: "转换失败",
  badgeBusy: "转换中…",
  statOriginal: "原始大小",
  statBase64: "Base64 文本体积",
  statIncrease: "体积增幅",
  statFormat: "格式",
  tabDataUri: "Data URI",
  tabRawBase64: "纯 Base64",
  codePlaceholder: "选择或拖入图片后，这里会显示转换结果…",
  charCount: "{n} 字符",
  copyButton: "复 制",
  copiedButton: "已复制",
  downloadButton: "下载 .txt",
  downloadFormat: "下载 .{ext} 文本",
  resultNote: "复制成功或失败都会有明确提示",

  formatsTitle: "支持的图片格式",
  limitsTitle: "使用限制与边界",
  limitSingle: "单张图片上限 <b>10 MB</b>，超出后给出提示并拒绝转换。",
  limitBatch: "支持多张图片批量处理，列表可逐张复制与下载。",
  limitCors: "在线图片受跨域限制时无法读取，请下载后改用本地上传。",
  limitBlocked: "转换全程在本地内存完成，无任何数据上传。",

  listTitle: "结果列表",
  clearAll: "全部清空",
  listEmpty: "还没有转换记录",
  rowCopy: "复制",
  rowDownload: "下载",
  rowRemove: "移除",

  privacyTitle: "本地转换，图片不出本机",
  privacyDesc: "所有转换均在浏览器内存中完成，图片不会上传至任何服务器。",
  footerCopy: "Base64 Studio · 纯前端工具，无需注册",
  footerPrivacy: "隐私说明",
  footerFormats: "格式支持",
  footerLang: "English version",
  alertCloseLabel: "关闭提示",

  errNoFile: "未选择文件",
  errNoFileDesc: "请先选择、拖入或粘贴一张图片。",
  errNotImage: "不支持的文件类型",
  errNotImageDesc: "「{name}」不是可识别的图片文件，请选择 JPG、PNG、GIF、WebP 或 SVG。",
  errTooLarge: "文件过大",
  errTooLargeDesc: "「{name}」大小为 {size}，超过单张 {limit} 的上限，已跳过。",
  errUrlEmpty: "请输入图片地址",
  errUrlEmptyDesc: "地址不能为空，请粘贴一个以 http:// 或 https:// 开头的图片链接。",
  errUrlInvalid: "地址格式无效",
  errUrlInvalidDesc: "「{url}」不是合法的图片地址，请检查后重试。",
  errUrlLoad: "在线图片加载失败",
  errUrlLoadDesc:
    "无法读取该图片，可能地址已失效、不是图片资源，或该站点禁止跨域（CORS）访问。请下载图片后改用本地上传。",
  errUrlType: "该地址不是图片资源",
  errUrlTypeDesc: "服务器返回的内容类型为 {type}，不是可识别的图片。",
  errRead: "文件读取失败",
  errReadDesc: "读取「{name}」时发生错误，请重试或更换文件。",
  errCanvas: "图片解析失败",
  errCanvasDesc: "「{name}」无法被浏览器解码，文件可能已损坏。",
  errCopy: "复制失败",
  errCopyDesc: "浏览器拒绝了剪贴板访问，请手动选中文本复制，或改用「下载」按钮。",
  errCopyFallbackDesc: "剪贴板不可用，文本已自动选中，请按 Ctrl+C 复制。",

  okCopy: "已复制{label}到剪贴板",
  okDownload: "已开始下载 {name}",
  okLoaded: "已从在线地址加载图片",
  okAdded: "已添加 {n} 张图片",
  okSkipped: "已添加 {n} 张，另有 {m} 张被跳过",
  okCleared: "已清空全部记录",
  okRemoved: "已移除该条记录",

  labelUri: "Data URI",
  labelRaw: "纯 Base64",
  unitBytes: "B",
  unitKB: "KB",
  unitMB: "MB",
};

const en: Record<keyof typeof zh, string> = {
  brand: "Base64 Studio",
  langSwitchLabel: "Language / 语言",
  langZh: "中文",
  langEn: "EN",

  noscriptTitle: "This tool requires JavaScript.",
  noscriptBody:
    "All image-to-base64 conversion runs locally in your browser, so JavaScript is required. Please enable it and reload this page.",

  heroTitle: "Image to Base64 Converter",
  heroSubtitle:
    "Convert image to base64 online — from a local file, a drag-and-drop, a paste, or an image URL. Get a Data URI and a raw base64 string instantly, with nothing ever uploaded.",
  heroCtaPrimary: "Paste an image or press Ctrl+V",
  heroCtaSecondary: "See supported formats",

  uploadTitle: "Choose an image",
  uploadCountZero: "0 files",
  uploadCount: "{n} files",
  dropzoneAriaDesc: "Drop an image here or click to choose a file",
  dropTitle: "Drag an image here, or click to browse",
  dropHint: "Supports JPG · PNG · GIF · WebP · SVG, or paste with Ctrl+V",
  dropTitleActive: "Release to add your image",
  pickButton: "Click to choose a file",
  urlLabel: "Convert image URL to base64",
  urlPlaceholder: "Paste an image URL: https://example.com/pic.png",
  loadButton: "Load",
  loadingButton: "Loading…",
  urlNote:
    "Note: online images must allow cross-origin reads. If it fails due to CORS, download the image and use local upload instead.",

  resultTitle: "Conversion result",
  badgeIdle: "Waiting for an image",
  badgeDone: "Converted",
  badgeError: "Conversion failed",
  badgeBusy: "Converting…",
  statOriginal: "Original size",
  statBase64: "Base64 text size",
  statIncrease: "Size increase",
  statFormat: "Format",
  tabDataUri: "Data URI",
  tabRawBase64: "Raw Base64",
  codePlaceholder: "Pick or drop an image and the converted result will appear here…",
  charCount: "{n} characters",
  copyButton: "Copy",
  copiedButton: "Copied",
  downloadButton: "Download .txt",
  downloadFormat: "Download .{ext} text",
  resultNote: "You get clear feedback on both success and failure",

  formatsTitle: "Supported image formats",
  limitsTitle: "Limits and boundaries",
  limitSingle: "Maximum <b>10 MB</b> per file — larger files are rejected with a notice.",
  limitBatch: "Multiple images are supported; copy or download each entry individually.",
  limitCors: "Online images blocked by CORS cannot be read — download them and upload locally.",
  limitBlocked: "Conversion happens entirely in local memory; nothing is uploaded.",

  listTitle: "Result list",
  clearAll: "Clear all",
  listEmpty: "No conversions yet",
  rowCopy: "Copy",
  rowDownload: "Download",
  rowRemove: "Remove",

  privacyTitle: "Converted locally — images never leave this device",
  privacyDesc: "Every conversion happens in browser memory. No image is sent to any server.",
  footerCopy: "Base64 Studio · a pure front-end tool, no sign-up required",
  footerPrivacy: "Privacy",
  footerFormats: "Formats",
  footerLang: "中文版",
  alertCloseLabel: "Dismiss notice",

  errNoFile: "No file selected",
  errNoFileDesc: "Please choose, drop, or paste an image first.",
  errNotImage: "Unsupported file type",
  errNotImageDesc: "“{name}” is not a recognised image. Please use JPG, PNG, GIF, WebP, or SVG.",
  errTooLarge: "File too large",
  errTooLargeDesc: "“{name}” is {size}, above the {limit} per-file limit, and was skipped.",
  errUrlEmpty: "Enter an image URL",
  errUrlEmptyDesc: "The field is empty. Paste a link that starts with http:// or https://.",
  errUrlInvalid: "Invalid URL",
  errUrlInvalidDesc: "“{url}” is not a valid image URL. Please check it and try again.",
  errUrlLoad: "Could not load the online image",
  errUrlLoadDesc:
    "The image could not be read — the URL may be dead, may not point to an image, or the site may block cross-origin (CORS) access. Download it and upload locally instead.",
  errUrlType: "That URL is not an image",
  errUrlTypeDesc: "The server returned a content type of {type}, which is not a recognised image.",
  errRead: "Could not read the file",
  errReadDesc: "Something went wrong reading “{name}”. Please try again or use another file.",
  errCanvas: "Could not decode the image",
  errCanvasDesc: "“{name}” could not be decoded by the browser; the file may be corrupted.",
  errCopy: "Copy failed",
  errCopyDesc:
    "The browser denied clipboard access. Select the text manually, or use the Download button instead.",
  errCopyFallbackDesc: "Clipboard access is unavailable, so the text was selected — press Ctrl+C to copy.",

  okCopy: "Copied {label} to clipboard",
  okDownload: "Download started for {name}",
  okLoaded: "Image loaded from the online URL",
  okAdded: "Added {n} image(s)",
  okSkipped: "Added {n}, skipped {m}",
  okCleared: "All records cleared",
  okRemoved: "Record removed",

  labelUri: "Data URI",
  labelRaw: "Raw Base64",
  unitBytes: "B",
  unitKB: "KB",
  unitMB: "MB",
};

export const dict: Record<Lang, Record<keyof typeof zh, string>> = { zh, en };
export type Dict = typeof zh;

/** Interpolate {placeholders}. Falls back to the key itself if absent. */
export function t(
  d: Partial<Dict>,
  key: keyof Dict,
  vars?: Record<string, string | number>
): string {
  let s = d[key] ?? zh[key] ?? String(key);
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.split(`{${k}}`).join(String(vars[k]));
    }
  }
  return s;
}

export function unitsOf(d: Partial<Dict>) {
  return {
    b: d.unitBytes ?? zh.unitBytes,
    kb: d.unitKB ?? zh.unitKB,
    mb: d.unitMB ?? zh.unitMB,
  };
}
