import type { Lang } from "./site";

/* ============================================================
   UI strings for the tool itself.

   Long-form landing copy lives in components/sections/, not here —
   this dictionary is only for interface text, where a missing or
   mismatched key would be a visible bug.

   Every non-default dictionary is declared as
   Record<keyof typeof zh, string>, so TypeScript fails the build if any
   language ever drifts out of sync with the reference key set.
   ============================================================ */

const zh = {
  brand: "Base64 Studio",
  langMenuLabel: "语言",

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

  /* ---------- shared by both tools ---------- */
  faqHeading: "常见问题",
  decFaqHeading: "常见问题",
  toolNavLabel: "工具切换",
  /* Spelled out rather than an arrow glyph. A bare "→" reads as a
     direction indicator (which way does it go?), while the two tabs are
     two *tools*, not two steps. "to" names the conversion instead. */
  toolEncode: "图片转 Base64",
  toolDecode: "Base64 转图片",

  /* ---------- reverse tool: hero ---------- */
  decHeroTitle: "Base64 转图片在线工具",
  decHeroSubtitle:
    "粘贴 Base64 字符串或 Data URI，解码还原为 PNG、JPG、WebP、SVG 图片，可预览、可下载 —— 全程在浏览器本地完成，字符串不会上传服务器。",
  decHeroCtaPrimary: "粘贴 Base64 字符串",
  decHeroCtaSecondary: "查看可解码的格式",

  /* ---------- reverse tool: interface ---------- */
  decInputTitle: "粘贴 Base64",
  decInputLabel: "Base64 或 Data URI",
  decPlaceholder:
    "在此粘贴 Base64 字符串或 data:image/png;base64,… —— 换行与空格会被自动忽略",
  decPasteButton: "从剪贴板粘贴",
  decClearButton: "清空",
  decInputNote:
    "提示：带不带 data: 前缀都可以。没有前缀时，格式由解码后的字节实测判定，不看声明。",
  decDetectedLabel: "识别结果",
  decDetectedEmpty: "等待输入",
  decDetectedPrefix: "前缀声明 {mime} · 解码后确认",
  decDetectedSniffed: "{mime} · {w}×{h}",
  decErrPrefixMismatch:
    "前缀与字节不一致：前缀声明 {declared}，实际字节为 {actual}，已按实际格式处理。",
  decResultTitle: "解码结果",
  decBadgeIdle: "等待粘贴字符串",
  decBadgeBusy: "正在解码…",
  decBadgeDone: "解码完成",
  decBadgeError: "解码失败",
  decPreviewAlt: "从 Base64 解码还原的图片",
  decStatSize: "解码后大小",
  decStatSaving: "较文本缩减",
  decStatDimensions: "像素尺寸",
  decDownloadButton: "下载 .{ext}",
  decCopyButton: "复制 Data URI",
  decResultNote: "下载得到的是原始二进制图片文件，不是文本",
  decPreviewUnavailable: "该格式在当前浏览器中无法预览，但文件可以正常下载。",

  /* ---------- reverse tool: errors and toasts ---------- */
  decErrEmpty: "还没有内容",
  decErrEmptyDesc: "请先粘贴一段 Base64 字符串或 Data URI。",
  decErrChars: "包含非 Base64 字符",
  decErrCharsDesc:
    "字符串里有 base64 字符集之外的字符（如 {chars}）。通常是从别处复制时带进了引号、行号或 Markdown 标记。",
  decErrTooLarge: "字符串过长",
  decErrTooLargeDesc:
    "当前字符串为 {size}，解码后数据将超过 {limit} 上限，已拒绝处理，以免一次性占用过多内存。",
  decErrNotImage: "不是可识别的图片",
  decErrNotImageDesc:
    "这段字符串能解码，但解出的字节不是已知的图片格式。它可能是别的内容被误当成 Base64，也可能是字符串被截断了。",
  decErrTruncated: "字符串被截断了",
  decErrTruncatedDesc:
    "字符都在 base64 字符集内，但长度为 {len}，这不是合法的 base64 长度 —— 字符串大概率是从中间被截断的。请检查是否漏拷了结尾部分。",
  decErrPaste: "无法读取剪贴板",
  decErrPasteDesc: "浏览器拒绝了剪贴板读取权限，请手动粘贴（Ctrl+V）。",
  decOkDecoded: "已解码 {name}",
  decOkCopied: "已复制 Data URI",
  decOkDownloaded: "已开始下载 {name}",
  decOkPasted: "已从剪贴板读取内容",

  /* ---------- reverse tool: side column ---------- */
  decFormatsTitle: "可解码的图片格式",
  decLimitsTitle: "解码限制与边界",
  decLimitSize:
    "解码后数据上限 <b>10 MB</b>，对应字符串约 {limit} 字符，超出直接拒绝。",
  decLimitSniff: "格式由字节头实测判定，data: 前缀只作提示，冲突时以字节为准。",
  decLimitWhitespace: "自动忽略换行与空格，支持 URL-safe 变体（- 与 _）与缺失的 = 补位。",
  decLimitBlocked: "解码全程在本地内存完成，字符串不会上传。",
  decPrivacyTitle: "本地解码，字符串不出本机",
  decPrivacyDesc: "所有解码均在浏览器内存中完成，字符串不会上传至任何服务器。",

  labelUri: "Data URI",
  labelRaw: "纯 Base64",
  unitBytes: "B",
  unitKB: "KB",
  unitMB: "MB",
};

const en: Record<keyof typeof zh, string> = {
  brand: "Base64 Studio",
  langMenuLabel: "Language",

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

  /* ---------- shared by both tools ---------- */
  faqHeading: "Frequently asked questions",
  decFaqHeading: "Frequently asked questions",
  toolNavLabel: "Tool switcher",
  /* See the zh dictionary for why this is not an arrow. */
  toolEncode: "Image to Base64",
  toolDecode: "Base64 to Image",

  /* ---------- reverse tool: hero ---------- */
  decHeroTitle: "Base64 to Image Converter",
  decHeroSubtitle:
    "Paste a base64 string or a data URI and decode it back into a PNG, JPG, WebP or SVG file you can preview and download — all in your browser, with nothing uploaded.",
  decHeroCtaPrimary: "Paste a base64 string",
  decHeroCtaSecondary: "See decodable formats",

  /* ---------- reverse tool: interface ---------- */
  decInputTitle: "Paste base64",
  decInputLabel: "Base64 or data URI",
  decPlaceholder:
    "Paste a base64 string or data:image/png;base64,… here — line breaks and spaces are ignored",
  decPasteButton: "Paste from clipboard",
  decClearButton: "Clear",
  decInputNote:
    "A data: prefix is optional. Without one the format is read from the decoded bytes rather than from a label.",
  decDetectedLabel: "Detected",
  decDetectedEmpty: "Waiting for input",
  decDetectedPrefix: "Prefix says {mime} · confirmed on decode",
  decDetectedSniffed: "{mime} · {w}×{h}",
  decErrPrefixMismatch:
    "The prefix disagrees with the bytes: it says {declared}, the data is {actual}. Handled as {actual}.",
  decResultTitle: "Decoded image",
  decBadgeIdle: "Waiting for a string",
  decBadgeBusy: "Decoding…",
  decBadgeDone: "Decoded",
  decBadgeError: "Could not decode",
  decPreviewAlt: "The image decoded from the base64 string",
  decStatSize: "Decoded size",
  decStatSaving: "Smaller than the text",
  decStatDimensions: "Pixels",
  decDownloadButton: "Download .{ext}",
  decCopyButton: "Copy Data URI",
  decResultNote: "The download is the original binary image file, not text",
  decPreviewUnavailable:
    "This format cannot be previewed in your browser, but the file still downloads correctly.",

  /* ---------- reverse tool: errors and toasts ---------- */
  decErrEmpty: "Nothing to decode yet",
  decErrEmptyDesc: "Paste a base64 string or a data URI first.",
  decErrChars: "Not valid base64",
  decErrCharsDesc:
    "The string contains characters outside the base64 alphabet (for example {chars}). Usually a quote, a line number or Markdown markers came along with the copy.",
  decErrTooLarge: "String too long",
  decErrTooLargeDesc:
    "This string is {size} and would decode to more than {limit}, so it was refused rather than risking a stalled tab.",
  decErrNotImage: "Not a recognisable image",
  decErrNotImageDesc:
    "The string decodes, but the resulting bytes are not a known image format. It may be something else that merely looks like base64, or the string may be truncated.",
  decErrTruncated: "The string is cut short",
  decErrTruncatedDesc:
    "Every character is valid base64, but the length is {len}, which base64 cannot produce — the string is almost certainly truncated. Check whether the end was left behind when copying.",
  decErrPaste: "Could not read the clipboard",
  decErrPasteDesc: "The browser denied clipboard access. Paste manually with Ctrl+V instead.",
  decOkDecoded: "Decoded {name}",
  decOkCopied: "Data URI copied",
  decOkDownloaded: "Download started for {name}",
  decOkPasted: "Read from the clipboard",

  /* ---------- reverse tool: side column ---------- */
  decFormatsTitle: "Formats you can decode",
  decLimitsTitle: "Limits and boundaries",
  decLimitSize:
    "Up to <b>10 MB</b> of decoded data — roughly {limit} characters of base64; anything larger is refused outright.",
  decLimitSniff:
    "The format is read from the magic bytes. A data: prefix is a hint only — when the two disagree, the bytes win.",
  decLimitWhitespace:
    "Line breaks and spaces are ignored; the URL-safe alphabet (- and _) and missing = padding are accepted.",
  decLimitBlocked: "Decoding happens entirely in local memory; the string is never uploaded.",
  decPrivacyTitle: "Decoded locally — the string never leaves this device",
  decPrivacyDesc: "Every decode happens in browser memory. No string is sent to any server.",

  labelUri: "Data URI",
  labelRaw: "Raw Base64",
  unitBytes: "B",
  unitKB: "KB",
  unitMB: "MB",
};

/*
 * German. Informelles "du", passend zum direkten "you" der englischen
 * Fassung und zum Ton von Entwicklerwerkzeugen. Auch die Tastenkürzel
 * sind lokalisiert (Strg statt Ctrl) — "Ctrl+V" wäre auf einer deutschen
 * Tastatur schlicht die falsche Beschriftung.
 */
const de: Record<keyof typeof zh, string> = {
  brand: "Base64 Studio",
  langMenuLabel: "Sprache",

  noscriptTitle: "Dieses Werkzeug benötigt JavaScript.",
  noscriptBody:
    "Die Umwandlung von Bildern zu Base64 läuft vollständig in deinem Browser, deshalb ist JavaScript erforderlich. Bitte aktiviere es und lade die Seite neu.",

  heroTitle: "Bild zu Base64 Konverter",
  heroSubtitle:
    "Bild in Base64 umwandeln – online, aus einer Datei, per Einfügen oder über eine Bild-URL. Du erhältst sofort eine Data URI und einen reinen Base64-String, und nichts wird hochgeladen.",
  heroCtaPrimary: "Bild einfügen oder Strg+V drücken",
  heroCtaSecondary: "Unterstützte Formate ansehen",

  uploadTitle: "Bild auswählen",
  uploadCountZero: "0 Dateien",
  uploadCount: "{n} Dateien",
  dropzoneAriaDesc: "Bild hierher ziehen oder klicken, um eine Datei auszuwählen",
  dropTitle: "Zieh ein Bild hierher oder klicke zum Durchsuchen",
  dropHint: "Unterstützt JPG · PNG · GIF · WebP · SVG, oder mit Strg+V einfügen",
  dropTitleActive: "Loslassen, um das Bild hinzuzufügen",
  pickButton: "Datei auswählen",
  urlLabel: "Bild-URL zu Base64",
  urlPlaceholder: "Bild-URL einfügen: https://example.com/pic.png",
  loadButton: "Laden",
  loadingButton: "Wird geladen…",
  urlNote:
    "Hinweis: Online-Bilder müssen Cross-Origin-Zugriffe erlauben. Schlägt es wegen CORS fehl, lade das Bild herunter und nutze den lokalen Upload.",

  resultTitle: "Ergebnis",
  badgeIdle: "Warte auf ein Bild",
  badgeDone: "Umgewandelt",
  badgeError: "Umwandlung fehlgeschlagen",
  badgeBusy: "Wird umgewandelt…",
  statOriginal: "Originalgröße",
  statBase64: "Base64-Textgröße",
  statIncrease: "Größenzunahme",
  statFormat: "Format",
  tabDataUri: "Data URI",
  tabRawBase64: "Reines Base64",
  codePlaceholder: "Wähle ein Bild aus oder zieh es hierher – das Ergebnis erscheint dann an dieser Stelle…",
  charCount: "{n} Zeichen",
  copyButton: "Kopieren",
  copiedButton: "Kopiert",
  downloadButton: ".txt herunterladen",
  downloadFormat: ".{ext}-Text herunterladen",
  resultNote: "Du bekommst eine klare Rückmeldung – bei Erfolg wie bei Fehlern",

  formatsTitle: "Unterstützte Bildformate",
  limitsTitle: "Grenzen und Limitierungen",
  limitSingle: "Maximal <b>10 MB</b> pro Datei – größere Dateien werden mit Hinweis abgelehnt.",
  limitBatch: "Mehrere Bilder sind möglich; kopiere oder lade jeden Eintrag einzeln.",
  limitCors: "Online-Bilder, die CORS blockiert, lassen sich nicht lesen – lade sie herunter und nutze den lokalen Upload.",
  limitBlocked: "Die Umwandlung läuft vollständig im lokalen Speicher; es wird nichts hochgeladen.",

  listTitle: "Ergebnisliste",
  clearAll: "Alle löschen",
  listEmpty: "Noch keine Umwandlungen",
  rowCopy: "Kopieren",
  rowDownload: "Herunterladen",
  rowRemove: "Entfernen",

  privacyTitle: "Lokal umgewandelt – Bilder verlassen dieses Gerät nicht",
  privacyDesc:
    "Jede Umwandlung findet im Browserspeicher statt. Kein Bild wird an einen Server gesendet.",
  footerCopy: "Base64 Studio · ein reines Frontend-Werkzeug, keine Anmeldung nötig",
  footerPrivacy: "Datenschutz",
  footerFormats: "Formate",
  alertCloseLabel: "Hinweis schließen",

  errNoFile: "Keine Datei ausgewählt",
  errNoFileDesc: "Bitte wähle zuerst ein Bild aus, zieh es hierher oder füge es ein.",
  errNotImage: "Nicht unterstützter Dateityp",
  errNotImageDesc: "„{name}“ ist kein erkennbares Bild. Bitte nutze JPG, PNG, GIF, WebP oder SVG.",
  errTooLarge: "Datei zu groß",
  errTooLargeDesc:
    "„{name}“ ist {size} groß und überschreitet damit das Limit von {limit} pro Datei – wurde übersprungen.",
  errUrlEmpty: "Bild-URL eingeben",
  errUrlEmptyDesc: "Das Feld ist leer. Füge einen Link ein, der mit http:// oder https:// beginnt.",
  errUrlInvalid: "Ungültige URL",
  errUrlInvalidDesc: "„{url}“ ist keine gültige Bild-URL. Bitte prüfe sie und versuche es erneut.",
  errUrlLoad: "Online-Bild konnte nicht geladen werden",
  errUrlLoadDesc:
    "Das Bild konnte nicht gelesen werden – die URL ist möglicherweise tot, verweist nicht auf ein Bild, oder die Website blockiert Cross-Origin-Zugriffe (CORS). Lade es herunter und nutze den lokalen Upload.",
  errUrlType: "Diese URL ist kein Bild",
  errUrlTypeDesc: "Der Server hat den Content-Type {type} zurückgegeben – kein erkennbares Bild.",
  errRead: "Datei konnte nicht gelesen werden",
  errReadDesc:
    "Beim Lesen von „{name}“ ist ein Fehler aufgetreten. Bitte versuche es erneut oder nutze eine andere Datei.",
  errCanvas: "Bild konnte nicht dekodiert werden",
  errCanvasDesc:
    "„{name}“ konnte vom Browser nicht dekodiert werden; die Datei ist möglicherweise beschädigt.",
  errCopy: "Kopieren fehlgeschlagen",
  errCopyDesc:
    "Der Browser hat den Zugriff auf die Zwischenablage verweigert. Markiere den Text manuell oder nutze die Schaltfläche zum Herunterladen.",
  errCopyFallbackDesc:
    "Die Zwischenablage ist nicht verfügbar, deshalb wurde der Text markiert – drücke Strg+C zum Kopieren.",

  okCopy: "{label} in die Zwischenablage kopiert",
  okDownload: "Download von {name} gestartet",
  okLoaded: "Bild von der Online-URL geladen",
  okAdded: "{n} Bild(er) hinzugefügt",
  okSkipped: "{n} hinzugefügt, {m} übersprungen",
  okCleared: "Alle Einträge gelöscht",
  okRemoved: "Eintrag entfernt",

  /* ---------- von beiden Werkzeugen geteilt ---------- */
  faqHeading: "Häufige Fragen",
  decFaqHeading: "Häufige Fragen",
  toolNavLabel: "Werkzeugwechsel",
  /* "zu" is the German counterpart of the English "to"; the arrow would
     have the same direction-indicator problem here. */
  toolEncode: "Bild zu Base64",
  toolDecode: "Base64 zu Bild",

  /* ---------- umgekehrte Richtung: Hero ---------- */
  decHeroTitle: "Base64 zu Bild Konverter",
  decHeroSubtitle:
    "Füge einen Base64-String oder eine Data URI ein und dekodiere ihn zurück in eine PNG-, JPG-, WebP- oder SVG-Datei mit Vorschau und Download – alles im Browser, nichts wird hochgeladen.",
  decHeroCtaPrimary: "Base64-String einfügen",
  decHeroCtaSecondary: "Dekodierbare Formate ansehen",

  /* ---------- umgekehrte Richtung: Oberfläche ---------- */
  decInputTitle: "Base64 einfügen",
  decInputLabel: "Base64 oder Data URI",
  decPlaceholder:
    "Base64-String oder data:image/png;base64,… hier einfügen – Zeilenumbrüche und Leerzeichen werden ignoriert",
  decPasteButton: "Aus Zwischenablage einfügen",
  decClearButton: "Leeren",
  decInputNote:
    "Ein data:-Präfix ist optional. Ohne Präfix wird das Format aus den dekodierten Bytes bestimmt, nicht aus einer Bezeichnung.",
  decDetectedLabel: "Erkannt",
  decDetectedEmpty: "Warte auf Eingabe",
  decDetectedPrefix: "Präfix nennt {mime} · Bestätigung beim Dekodieren",
  decDetectedSniffed: "{mime} · {w}×{h}",
  decErrPrefixMismatch:
    "Präfix und Bytes widersprechen sich: Präfix {declared}, Daten {actual}. Verarbeitet als {actual}.",
  decResultTitle: "Dekodiertes Bild",
  decBadgeIdle: "Warte auf einen String",
  decBadgeBusy: "Wird dekodiert…",
  decBadgeDone: "Dekodiert",
  decBadgeError: "Dekodieren fehlgeschlagen",
  decPreviewAlt: "Das aus dem Base64-String dekodierte Bild",
  decStatSize: "Dekodierte Größe",
  decStatSaving: "Kleiner als der Text",
  decStatDimensions: "Pixel",
  decDownloadButton: ".{ext} herunterladen",
  decCopyButton: "Data URI kopieren",
  decResultNote: "Der Download liefert die ursprüngliche Binärdatei, keinen Text",
  decPreviewUnavailable:
    "Dieses Format lässt sich in deinem Browser nicht anzeigen, die Datei lässt sich aber korrekt herunterladen.",

  /* ---------- umgekehrte Richtung: Fehler und Hinweise ---------- */
  decErrEmpty: "Noch nichts zu dekodieren",
  decErrEmptyDesc: "Füge zuerst einen Base64-String oder eine Data URI ein.",
  decErrChars: "Kein gültiges Base64",
  decErrCharsDesc:
    "Der String enthält Zeichen außerhalb des Base64-Alphabets (zum Beispiel {chars}). Meist sind beim Kopieren ein Anführungszeichen, eine Zeilennummer oder Markdown-Zeichen mitgekommen.",
  decErrTooLarge: "String zu lang",
  decErrTooLargeDesc:
    "Dieser String ist {size} lang und würde auf mehr als {limit} dekodieren; er wurde abgelehnt, statt einen hängenden Tab zu riskieren.",
  decErrNotImage: "Kein erkennbares Bild",
  decErrNotImageDesc:
    "Der String lässt sich dekodieren, die Bytes sind aber kein bekanntes Bildformat. Vielleicht ist es etwas anderes, das nur wie Base64 aussieht, oder der String ist abgeschnitten.",
  decErrTruncated: "Der String ist abgeschnitten",
  decErrTruncatedDesc:
    "Alle Zeichen gehören zum Base64-Alphabet, aber die Länge {len} kann Base64 nicht erzeugen – der String ist mit hoher Wahrscheinlichkeit abgeschnitten. Prüfe, ob beim Kopieren das Ende verloren ging.",
  decErrPaste: "Zwischenablage konnte nicht gelesen werden",
  decErrPasteDesc: "Der Browser hat den Zugriff verweigert. Füge den Text manuell mit Strg+V ein.",
  decOkDecoded: "{name} dekodiert",
  decOkCopied: "Data URI kopiert",
  decOkDownloaded: "Download von {name} gestartet",
  decOkPasted: "Aus der Zwischenablage gelesen",

  /* ---------- umgekehrte Richtung: Seitenspalte ---------- */
  decFormatsTitle: "Formate, die du dekodieren kannst",
  decLimitsTitle: "Grenzen und Limitierungen",
  decLimitSize:
    "Bis zu <b>10 MB</b> dekodierte Daten – rund {limit} Zeichen Base64; alles darüber wird abgelehnt.",
  decLimitSniff:
    "Das Format wird an den Magic Bytes erkannt. Ein data:-Präfix ist nur ein Hinweis – widersprechen sich beide, gewinnen die Bytes.",
  decLimitWhitespace:
    "Zeilenumbrüche und Leerzeichen werden ignoriert; das URL-sichere Alphabet (- und _) sowie fehlendes =-Padding werden akzeptiert.",
  decLimitBlocked: "Das Dekodieren läuft vollständig im lokalen Speicher; der String wird nie hochgeladen.",
  decPrivacyTitle: "Lokal dekodiert – der String verlässt dieses Gerät nicht",
  decPrivacyDesc: "Jedes Dekodieren findet im Browserspeicher statt. Kein String wird an einen Server gesendet.",

  labelUri: "Data URI",
  labelRaw: "Reines Base64",
  unitBytes: "B",
  unitKB: "KB",
  unitMB: "MB",
};

export const dict: Record<Lang, Record<keyof typeof zh, string>> = { zh, en, de };
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
