import type { Lang, Page } from "./site";

/* ============================================================
   FAQ — the single source for both the rendered accordion and the
   FAQPage structured data, so the two can never disagree.

   Keyed by page as well as language. The two tools answer different
   questions, and emitting one FAQPage payload on two URLs would tell a
   crawler they are duplicates.

   Answers are written as plain text. Backticked spans are rendered as
   inline code on the page and stripped for the JSON-LD payload.
   ============================================================ */

export type Faq = { q: string; a: string };

/* ------------------------------------------------------------------ *
 * Forward tool — image → base64
 * ------------------------------------------------------------------ */

const enEncode: Faq[] = [
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

const zhEncode: Faq[] = [
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

const deEncode: Faq[] = [
  {
    q: "Wie wandle ich ein Bild in Base64 um?",
    a: "Zieh ein Bild auf die Ablagefläche, klicke zum Auswählen einer Datei oder füge es direkt mit Strg+V (Cmd+V unter macOS) aus der Zwischenablage ein. Der Konverter liest die Bytes lokal und gibt den Base64-String sofort zurück – es gibt keinen Upload-Schritt und keine Warteschlange, das Ergebnis erscheint also so schnell, wie die Datei gelesen werden kann.",
  },
  {
    q: "Wie wandle ich eine Bild-URL in Base64 um?",
    a: "Füge die Bildadresse in das Feld „Bild-URL zu Base64“ ein und klicke auf Laden. Das Werkzeug fordert die Bytes an und kodiert sie direkt, wodurch du auch die exakte Originalgröße statt einer Schätzung erhältst. Erlaubt der Host keine Cross-Origin-Zugriffe, blockiert der Browser den Zugriff; der Konverter versucht es dann über ein Canvas-Element erneut und rät dir, falls auch das blockiert wird, das Bild herunterzuladen und den lokalen Upload zu nutzen.",
  },
  {
    q: "Ist dieser Bild-zu-Base64-Konverter kostenlos und funktioniert er online?",
    a: "Er ist kostenlos, benötigt kein Konto und läuft in jedem modernen Browser auf Desktop und Mobilgeräten. Da jede Umwandlung innerhalb der Seite stattfindet, gibt es nichts zu installieren, keine Warteschlange und kein Kontingent.",
  },
  {
    q: "Was macht Base64-Kodieren mit der Dateigröße?",
    a: "Base64-Kodieren bildet je 3 Bytes Binärdaten auf 4 ASCII-Zeichen ab, der kodierte Text ist also rund 33 % größer als die Originaldatei. Das Data-URI-Präfix kommt mit ein paar Zeichen hinzu. Die Statistikzeile über dem Ergebnis zeigt den gemessenen Wert für dein konkretes Bild und keine Faustregel.",
  },
  {
    q: "Welche Bildformate kann ich Base64-kodieren?",
    a: "JPG, JPEG, PNG, GIF, WebP, BMP, SVG und ICO, bis zu 10 MB pro Datei. SVG wird als Text gelesen, damit die Nutzlast mit dem Original-Markup identisch bleibt, und das im Ergebnis angezeigte Format wird anhand der Magic Bytes der Datei erkannt statt dem Dateinamen zu vertrauen.",
  },
  {
    q: "Was kann ich mit der Data URI anfangen?",
    a: "Füge sie in ein src-Attribut im HTML, ein background-image in CSS, ein Markdown-Bild oder einen JavaScript-String ein. Am nützlichsten ist sie für kleine Symbole und Logos, die sonst eine zusätzliche Netzwerkanfrage kosten würden; bei großen Fotos überwiegen die 33 % Mehraufwand und der Verlust des Browser-Caches meist den gesparten Request.",
  },
  {
    q: "Werden meine Bilder auf einen Server hochgeladen?",
    a: "Nein. Die Umwandlung läuft im Browserspeicher und die Bytes werden nie übertragen. Du kannst das im Netzwerk-Panel deines Browsers überprüfen – die einzigen Anfragen betreffen die Seite selbst.",
  },
];

/* ------------------------------------------------------------------ *
 * Reverse tool — base64 → image
 *
 * Written as the inverse of the set above, not as a translation of it:
 * someone arriving here with a string that will not decode has different
 * questions from someone trying to produce one.
 * ------------------------------------------------------------------ */

const enDecode: Faq[] = [
  {
    q: "How do I convert base64 to image?",
    a: "Paste the base64 string into the field above, with or without a `data:` URI prefix. The converter validates it, reads the real format from the first bytes of the decoded data, and renders the image — then Download saves it as a file.",
  },
  {
    q: "Can I decode base64 to image without a data URI prefix?",
    a: "Yes. A raw base64 string carries no type information at all, so the format is detected from the decoded bytes themselves, using the same magic-byte check the encoder relies on. If a prefix is present it is treated as a hint only: when it disagrees with the bytes, the bytes win and the page tells you the prefix was wrong.",
  },
  {
    q: "Why will my base64 string not decode?",
    a: "Three causes account for nearly all of it: the string was truncated when it was copied, it contains characters outside the base64 alphabet (a stray quote or a line number that came along with it), or it is not base64 at all. The tool names which of the three it found rather than returning a generic error.",
  },
  {
    q: "Does it handle line breaks and URL-safe base64?",
    a: "Yes. Whitespace and line breaks are ignored, so a string wrapped by an email client or an editor still decodes. The URL-safe alphabet using `-` and `_` is accepted alongside the standard `+` and `/`, and missing `=` padding is restored before decoding.",
  },
  {
    q: "Which formats can base64 be decoded to?",
    a: "PNG, JPG, GIF, WebP, BMP, ICO, SVG and AVIF, up to 10 MB of decoded data. The format is identified from the bytes, so a string labelled PNG that actually contains a JPEG decodes as a JPEG. SVG is returned as its original markup and previewed as an image — never injected into the page as markup.",
  },
  {
    q: "Is my base64 string uploaded anywhere?",
    a: "No. Decoding happens in browser memory and the string is never transmitted. You can confirm it in your browser's network panel — the only request is for the page itself.",
  },
];

const zhDecode: Faq[] = [
  {
    q: "怎样把 Base64 转成图片？",
    a: "把 Base64 字符串粘贴到上方输入框即可，带不带 `data:` 前缀都行。工具会先校验字符串，再从解码后数据的最前面几个字节识别真实格式并渲染出图片，点击下载即可保存为文件。",
  },
  {
    q: "没有 Data URI 前缀也能解码吗？",
    a: "可以。纯 Base64 字符串本身不含任何类型信息，因此格式由解码后的字节实测得出，用的是与编码方向相同的字节头识别。若字符串带有前缀，前缀只当作提示：一旦它与字节矛盾，以字节为准，并在页面上告知你前缀有误。",
  },
  {
    q: "为什么我的 Base64 字符串解不出来？",
    a: "几乎全部情况都落在三种原因上：复制时字符串被截断、混入了 base64 字符集之外的字符（比如一起复制进来的引号或行号）、或者它根本不是 base64。工具会指出命中的是哪一种，而不是笼统报错。",
  },
  {
    q: "带换行或 URL-safe 字符的字符串能处理吗？",
    a: "能。空格与换行会被忽略，被邮件客户端或编辑器折行过的字符串照样可解；URL-safe 变体（`-` 与 `_`）与标准的 `+`、`/` 一并接受，缺失的 `=` 补位会在解码前自动补回。",
  },
  {
    q: "可以解码成哪些图片格式？",
    a: "PNG、JPG、GIF、WebP、BMP、ICO、SVG 与 AVIF，解码后数据上限 10 MB。格式完全由字节判定，所以一个标着 PNG 实则内容是 JPEG 的字符串，会按 JPEG 解码。SVG 会还原为原始代码并按图片预览，绝不会作为标记注入页面。",
  },
  {
    q: "Base64 字符串会被上传吗？",
    a: "不会。解码全程在浏览器内存中完成，字符串不会被发送出去。你可以打开浏览器的网络面板确认：除了页面本身，没有任何额外请求。",
  },
];

const deDecode: Faq[] = [
  {
    q: "Wie wandle ich Base64 in ein Bild um?",
    a: "Füge den Base64-String oben in das Feld ein – mit oder ohne `data:`-URI-Präfix. Der Konverter prüft ihn, liest das echte Format aus den ersten Bytes der dekodierten Daten und zeigt das Bild an; mit Download speicherst du es als Datei.",
  },
  {
    q: "Kann ich Base64 auch ohne Data-URI-Präfix dekodieren?",
    a: "Ja. Ein reiner Base64-String enthält überhaupt keine Typinformation, deshalb wird das Format aus den dekodierten Bytes selbst erkannt – mit derselben Magic-Byte-Prüfung, auf die sich die umgekehrte Richtung stützt. Ein vorhandenes Präfix gilt nur als Hinweis: widerspricht es den Bytes, gewinnen die Bytes, und die Seite sagt dir, dass das Präfix falsch war.",
  },
  {
    q: "Warum lässt sich mein Base64-String nicht dekodieren?",
    a: "Drei Ursachen erklären fast alle Fälle: der String wurde beim Kopieren abgeschnitten, er enthält Zeichen außerhalb des Base64-Alphabets (etwa ein mitkopiertes Anführungszeichen oder eine Zeilennummer), oder er ist gar kein Base64. Das Werkzeug benennt den konkreten Fall, statt eine allgemeine Fehlermeldung auszugeben.",
  },
  {
    q: "Funktionieren Zeilenumbrüche und URL-sichere Zeichen?",
    a: "Ja. Leerzeichen und Zeilenumbrüche werden ignoriert, ein von E-Mail-Programmen oder Editoren umbrochener String lässt sich also weiterhin dekodieren. URL-sichere Varianten mit `-` und `_` werden ebenso akzeptiert wie `+` und `/`, fehlendes `=`-Padding wird vor dem Dekodieren ergänzt.",
  },
  {
    q: "In welche Formate kann Base64 dekodiert werden?",
    a: "PNG, JPG, GIF, WebP, BMP, ICO, SVG und AVIF, bis zu 10 MB dekodierte Daten. Das Format wird aus den Bytes bestimmt: ein als PNG bezeichneter String, der tatsächlich ein JPEG enthält, wird als JPEG dekodiert. SVG wird als Original-Markup zurückgegeben und als Bild angezeigt – nie als Markup in die Seite eingefügt.",
  },
  {
    q: "Wird mein Base64-String irgendwohin hochgeladen?",
    a: "Nein. Das Dekodieren läuft im Browserspeicher und der String wird nie übertragen. Du kannst das im Netzwerk-Panel deines Browsers überprüfen – die einzige Anfrage betrifft die Seite selbst.",
  },
];

export const FAQ: Record<Page, Record<Lang, Faq[]>> = {
  encode: { zh: zhEncode, en: enEncode, de: deEncode },
  decode: { zh: zhDecode, en: enDecode, de: deDecode },
};

/** Plain-text answer for structured data. */
export const plain = (s: string) => s.replace(/`/g, "");
