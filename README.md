# Base64 Studio

[English](#english) · [中文](#中文)

A pair of browser-side Base64 converters — image → Base64 and Base64 → image —
built as a fully static Next.js site with **six independently indexable pages**:
both tools in English, German and Chinese.

一个纯浏览器端运行的 Base64 双向转换工具（图片 ⇄ Base64），以 Next.js 全静态导出，两个工具 × 英、德、中三种语言，共六个可独立被搜索引擎索引的页面。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

---

## English

### What it is

Two tools, one page each:

- **Image to Base64** (`/`) turns an image into a Base64 string, plus the two
  things people actually need alongside it: the Data URI form, and a truthful
  size comparison between the original file and the resulting text.
- **Base64 to Image** (`/base64-to-image/`) takes a Base64 string — bare, or
  wrapped in a `data:` URI, quotes or a CSS `url(…)` — and gives back a real
  binary image file you can preview and download.

The names above are the tool tabs in the header, verbatim. They read "to" rather
than an arrow on purpose: the two tabs are two *tools*, not two steps of one
flow, and "Image → Base64" reads as a direction the visitor has to interpret.

The header itself is one row: the wordmark at 20 px on the left, and on the
right the two tool tabs beside a **collapsed language menu**. That menu is a
native `<details>` over real `<a href>` links rather than a `<select>` — the
rendered language has to keep matching the URL that canonical and hreflang
advertise, and a select would put navigation behind JavaScript on a site whose
language mechanism is deliberately URL-only. The trigger says what the control
*is* ("Language") and the current language is marked inside the menu, so the
trigger's width never changes as languages are added. On a phone the word is
dropped and the globe carries it, and the cluster wraps to a second row — both
better than shrinking the wordmark back into a small label.

They are separate pages rather than two tabs, because they are searched as two
distinct query clusters: a page can only carry five H2 sections well, and the
title and H1 of one page cannot lead both clusters at once.

Alongside the tool itself, this is a reference implementation of a problem that
trips up a lot of multilingual sites: **serving every language as its own real
URL, with correct `<html lang>`, canonical and hreflang at build time, without
any client-side language swapping** — where "every language" means every
*language × page* pair, and an hreflang set has to point at the equivalent
*page* rather than the language root.

Nothing is uploaded, in either direction. Conversion happens entirely in the
browser.

### Features

| Area | What it does |
| --- | --- |
| **Three input paths** | Click to select, drag & drop, or paste from the clipboard — plus loading a remote image from a URL |
| **Two output forms** | Data URI (`data:image/png;base64,…`) and raw Base64, switched by tab |
| **Honest size reporting** | Shows the original byte size, the resulting text size, and the growth factor — so the trade-off is visible before you commit to inlining |
| **One-click copy / download** | Copy with a three-tier fallback; download the result as a `.txt` file named after the source |
| **Decoding** | Paste a Base64 string, a Data URI, a quoted string or a `url(…)` wrapper and get the image back — with live validation and a real binary download |
| **Format detection** | Both directions read the format from the bytes, never from a label. When a `data:` prefix disagrees with the signature, the bytes win and you are told |
| **Trilingual** | Complete en, de and zh-CN UI; every label, placeholder, toast and error message is translated — the German build localises even the key hints (`Strg+V`, not `Ctrl+V`) |
| **Responsive** | Works from a 360 px phone up to a wide desktop |
| **Accessible** | Real `<button>` / `<a>` / `<label>` elements, `aria-selected` tabs, keyboard-operable, visible focus |

### Supported formats and limits

**Encoding** accepts PNG, JPEG, GIF, WebP, BMP, SVG, ICO.

**Decoding** accepts PNG, JPEG, GIF, WebP, BMP, SVG, ICO **and AVIF** — one more
than the encoder, because any Base64 string someone hands you can be decoded
whatever produced it, and AVIF is the format the encoder never needed to accept.

| Limit | Value | Where |
| --- | --- | --- |
| Max size per file | 10 MB | `MAX_BYTES` in `src/lib/convert.ts` |
| Max decoded size | 10 MB | derived from the same constant in `src/lib/decode.ts` |
| Max Base64 string | 13,981,016 characters | `MAX_CHARS` in `src/lib/decode.ts` |
| Max files per drop | 20 | `MAX_FILES_PER_DROP` |
| Max records kept | 30 | `MAX_RECORDS` |

Oversized files, non-image files, invalid URLs, failed loads, illegal Base64
characters, truncated strings, oversized payloads and undecodable data each
produce a specific, translated message rather than a generic failure.

### How it works

**Conversion.** `File` → `ArrayBuffer` → Base64. The `btoa` step is chunked at
`0x8000` bytes because passing a whole multi-megabyte string to `btoa` overflows
the call stack.

**Format detection.** Rather than trusting `File.type` (which browsers sometimes
get wrong, and which a renamed file makes a lie), the leading bytes are sniffed
for magic numbers. This guarantees the Data URI prefix can never disagree with
the payload underneath it.

**Loading a remote image.** Two paths, tried in order:

1. `fetch(url)` → `arrayBuffer()`. This gives exact bytes and the true size, but
   requires the remote server to send permissive CORS headers.
2. `<img>` + `<canvas>` — no CORS needed to *display*, but reading pixels back
   taints the canvas unless CORS allowed it, throwing `SecurityError`.

The UI reports which path was used, because the reported size is exact in the
first case and approximate in the second. A user who needs precision needs
case 1, and should know when they didn't get it.

**Clipboard.** `navigator.clipboard` → `document.execCommand('copy')` → select
the text in the document for manual copying. The result is reported as
`copied` or `selected` — never a silent no-op.

**Decoding.** The easy half is `atob`. The hard half is deciding what the
resulting bytes *are*: a raw Base64 string carries no type information at all,
and a `data:` prefix is a label someone else wrote, not a fact about the data.
So:

- The string is normalised first — quotes, a `url(…)` wrapper, a `data:` prefix,
  line breaks, the URL-safe alphabet and missing `=` padding are all handled
  before a byte is read. Only characters that are genuinely not Base64 survive
  to be reported.
- The length is checked against the ceiling **before** `atob` runs. Decoding a
  500 MB paste and then rejecting it is how a tab runs out of memory; refusing
  on an integer comparison is free.
- A payload length of `4n + 1` is arithmetically impossible in Base64, so it is
  reported as a truncated string rather than as a decoding failure.
- The format comes from the leading bytes — the full PNG signature, `FF D8 FF`
  for JPEG, the RIFF header for WebP, the brand list inside the ISO base media
  box for AVIF. SVG is recognised from its text, since it is markup rather than
  pixels.

For the full check order, see the `decode.ts` header comment.

**Decoded SVG is never inlined.** It is previewed through an `<img>` pointing at
a blob URL, where scripts do not execute. Rendering decoded SVG markup into the
document is how a decoder becomes an XSS vector.

### Getting started

Requires **Node.js 18.18+** (20 LTS or newer recommended).

```bash
npm install
npm run dev        # http://localhost:3000                          (en, image → base64)
                   # http://localhost:3000/base64-to-image/         (en, base64 → image)
                   # http://localhost:3000/de/                      (de, image → base64)
                   # http://localhost:3000/de/base64-to-image/      (de, base64 → image)
                   # http://localhost:3000/zh/                      (zh, image → base64)
                   # http://localhost:3000/zh/base64-to-image/      (zh, base64 → image)
```

Build a static site:

```bash
SITE_URL=https://your-domain.com npm run build
```

Output lands in `out/`. Serve it with any static file server:

```bash
npm run preview    # npx serve out
```

On Windows — or anywhere the inline `VAR=value cmd` form is awkward — copy
`.env.example` to `.env.production` and set the domain there instead. Next.js
loads that file at build time, and `.gitignore` already excludes it.

### Verification

Two independent suites, both of which must pass:

```bash
npm run verify   # 319 checks over the built HTML
npm run smoke    # 156 checks in a real headless browser
npm run check    # both, in order
```

`verify-seo.mjs` reads `out/` and runs its checks over **every page × language
pair** — six of them. Per page it asserts: keyword coverage in both body and
headings, title/description *pixel width* (not character count, which is
misleading for CJK), canonical pointing at that page's own path, `<html lang>`,
exactly one `<h1>`, ≥5 `<h2>`, Open Graph and Twitter tags, indexability,
parseable JSON-LD with the expected types and the deliberate absence of
`aggregateRating`, cross-language links, and `aria-current` on the active
language.

The hreflang assertions are the ones worth naming. Each of the three codes must
point at **this page's counterpart** — the German decoder's `hreflang="de"` is
`/de/base64-to-image/`, never `/de/` — and `x-default` must name the default
language's copy of *this* page. There is a second, explicit assertion that on
the reverse page no annotation resolves to a language root, because that is the
specific bug the page-aware routing exists to prevent. The sitemap is checked
the same way: each of its six `<url>` blocks must pair with its own page, so a
sitemap that lists six URLs but gives them all the same alternates block fails.
It also exits non-zero if the build still carries the placeholder domain.

`smoke.mjs` starts its own static server, drives headless Chrome over the
DevTools Protocol using Node's built-in WebSocket, and **compares bytes rather
than strings**. The encode suite runs on all three language pages: PNG and SVG
input, remote-URL loading, the invalid-URL and non-image warnings, hydration,
and a clean console. The decode suite also runs on all three, and covers raw
Base64, a contradicting `data:` prefix, a quoted/line-wrapped/URL-safe/unpadded
string, a truncated string, Base64 that is not an image, and clearing back to
idle — reading the result back out of the preview `<img>`'s own object URL, so
what is measured is the artefact a user would download.

The strongest check is the **cross-tool round trip**: a real 2,433-byte PNG goes
into the encoder, the Data URI it produces is copied across to the decoder the
way a user would carry it, and the bytes that come out are compared with the
originals. Neither tool is trusted on its own; the check only passes if both
agree.

The header gets its own two passes, at 1440 px and at 360 px, because it is the
part of the page whose layout is easiest to get wrong and hardest to notice.
At 1440 px it asserts the wordmark and the cluster really do share one row, that
the wordmark starts at the container's left edge and the menu ends at its right
edge, and that the wordmark's font size is at least 18 px — "it looks bigger in
the screenshot" is not a check. At 360 px it asserts the menu starts collapsed,
that all three entries point at *this page's* own translations and none at a
language root, and then drives the disclosure the way a visitor does: open by
click, close by outside click, close by Escape. The load-bearing assertion in
both passes is that the document never scrolls sideways. Zero third-party
dependencies.

SEO checks passing does not mean the tool works. This suite covers that gap.

### Project structure

```
src/
├── app/
│   ├── (en)/layout.tsx                        root layout, owns <html lang="en">
│   ├── (en)/page.tsx                          →  /                        (image → base64)
│   ├── (en)/base64-to-image/page.tsx          →  /base64-to-image/        (base64 → image)
│   ├── (de)/layout.tsx, de/page.tsx           →  /de/, /de/base64-to-image/
│   ├── (zh)/layout.tsx, zh/page.tsx           →  /zh/, /zh/base64-to-image/
│   ├── globals.css                            single source of truth for styling
│   ├── robots.ts, sitemap.ts                  file-convention generators, force-static
├── components/
│   ├── Shell.tsx                              owns <html lang> — never rewritten by JS
│   ├── Nav.tsx, Hero.tsx, JsonLd.tsx, Markup.tsx
│   ├── LangMenu.tsx                           the header's language disclosure
│   ├── Workspace.tsx                          the encoder's "use client" boundary
│   ├── tool/
│   │   ├── Decoder.tsx                        the decoder's "use client" boundary
│   │   ├── UploadCard / ResultCard / SideColumn   encoder UI
│   │   ├── PasteCard / DecodedCard / DecodeSideColumn   decoder UI
│   │   ├── useConverter.ts, useDecoder.ts     the two state machines
│   │   └── useToasts.ts, Toasts.tsx, Icons.tsx
│   └── sections/                              long-form content; each <h2> carries a
│                                              target query, per page per language
├── lib/
│   ├── site.ts                                ★ domain, LANGS, PAGES, pagePath(),
│   │                                          target queries, title/description
│   ├── dict.ts                                UI strings; en is typed against zh, so a
│   │                                          missing translation fails the build
│   ├── faq.ts                                 per page and language; one source for
│   │                                          both the accordion and the FAQPage
│   ├── convert.ts                             encoding core; error *codes*, not prose
│   └── decode.ts                              decoding core; sniffing, normalisation
│                                              and the four validation layers
public/                                        favicon, apple-touch-icon, OG image
scripts/                                       verify-seo.mjs, smoke.mjs
legacy-static/                                 the v1 single-file version, archived
```

Three design choices worth calling out, because they look like omissions:

**Language is determined by the URL, not by JavaScript.** Each route group has
its own root layout, so `<html lang>` is a build-time attribute. There is no
`localStorage` preference and no `navigator.language` sniffing. Adding either
would let the rendered language disagree with the hreflang and canonical tags
declared in the same document — which is exactly the bug this structure exists to
avoid.

**A URL is a `(language, page)` pair, not a language.** English is the default
language, so it is served from `/` and the forward tool owns each language's root
path; the reverse tool sits one segment below it. The pair is composed in exactly
one function, `pagePath(lang, page)` in `src/lib/site.ts`, and there is
deliberately no language-keyed `PATHS` map: such a lookup cannot express "the
same page in another language", so every call site that silently resolved to the
language root would be the exact bug the model exists to prevent. Callers have to
name the page they mean.

The two single lists live in `LANGS` and `PAGES` in `src/lib/site.ts`. The
hreflang sets, the sitemap entries, the Open Graph alternate locales, both
switchers and the page head are all generated from them, so a page cannot end up
routed but unadvertised — or advertised but unrouted. `x-default` names the
default language's copy of *the current page*, in the head and in the sitemap
alike.

The order of `LANGS` is the order the switcher renders, so changing which
language comes second is a one-line edit. hreflang sets and sitemap entries carry
no ordering semantics, which is why a reorder needs no matching change anywhere
else — only the switcher's visible sequence moves.

Three things cannot be derived from a value and must be edited by hand: the route
group directory, which is a filesystem fact; the `DECODE_SLUG` constant, which
must match the directory name; and the mirrored routing table at the top of
`scripts/verify-seo.mjs`, which is duplicated on purpose so the deliverable is
not certified by the code that produced it. `npm run verify` exits non-zero if a
half-finished addition leaves any of them out of step.

**Metadata is declared on each page, never on a route group's layout.** Each
language group now serves two pages, and a layout's `export const metadata` is
inherited by every page inside it — so a layout-level `canonical` would make two
different URLs claim to be the same page. This is the one Next.js convention in
the project that is actively wrong for a multi-page route group.

**German is written in the informal "du"**, matching the direct "you" of the
English page and the tone of developer tooling. The key hints are localised along
with the prose — `Strg+V`, not `Ctrl+V`, which would be the wrong label on a
German keyboard. Switching to "Sie" is a rewrite of every string in `dict.ts`,
`faq.ts` and both German guide components, not a find-and-replace: verb forms and
possessives change with the pronoun.

**`lib/convert.ts` and `lib/decode.ts` throw error codes, not messages.** They
are shared by all three languages, so user-facing prose belongs in `dict.ts`.
Neither has a `"use client"` directive, which keeps both usable from
server-rendered code.

### Deployment

The exported `out/` directory is plain static files. Any host works: Nginx or
Apache, Cloudflare Pages, Vercel, Netlify, an object store behind a CDN, GitHub
Pages.

Three things to know:

1. **Set `SITE_URL` at build time.** It feeds canonical URLs, hreflang, Open
   Graph, the sitemap and the JSON-LD. Leave it unset and the build warns while
   the verifier fails — because a site whose canonical points at `example.com`
   tells search engines the real page lives somewhere else.
2. **Serve from the domain root.** Assets resolve as `/_next/…`. Sub-path hosting
   (for example a GitHub Pages *project* site at `/repo-name/`) needs a matching
   `basePath` and `assetPrefix` in `next.config.mjs`, plus a `SITE_URL` that
   carries the same path. A user or organisation Pages site on a custom domain at
   the root needs no change.
3. **Support clean URLs.** `trailingSlash: true` means the non-default pages are
   `base64-to-image/index.html`, `de/index.html`, `de/base64-to-image/index.html`
   and so on, reached at `/base64-to-image/`, `/de/`, `/de/base64-to-image/`.
   Confirming your host serves directory indexes is what keeps all six pages
   reachable rather than just the English root.

### Gotchas

**TypeScript must stay on 5.x.** Installing TypeScript 7.x (the native Go
rewrite) makes Next 15.5 silently fail to read `paths` from `tsconfig.json`. The
symptom is misleading: `Module not found: '@/components/Hero'`, with no hint that
the alias is the problem, and `next-env.d.ts` never gets generated. The version is
pinned to `^5.9` for this reason.

**`paths` needs `baseUrl`.** Without `"baseUrl": "."` the `@/*` alias does not
resolve.

**`next-env.d.ts` is not committed.** It references `./.next/types/routes.d.ts`,
which does not exist in a fresh clone. Next regenerates it.

**Delete `out/` before rebuilding after a routing change.** Next's export writes
into the existing directory rather than replacing it, so removing a page — or
renaming its slug — leaves the old `index.html` in place and the verifier happily
checks a page the router no longer knows about. `rm -rf out && npm run build` is
the honest sequence whenever the set of routes changes.

**A route group's layout metadata is inherited by every page in it.** Since each
language group serves two pages, `export const metadata` on `(en)/layout.tsx`
would be applied to both, and both would emit the same canonical URL — telling a
crawler that one of the two pages does not exist. It is declared per page for
this reason, and the layouts carry only `viewport`. The same trap applies to
anything else a layout exports.

**Don't register a document-level `paste` listener from both tools.** Both state
machines listen on `document` so that pasting anywhere works. They are mounted on
different pages precisely so that only one is ever active; putting both tools on
one page would leave them competing for the same event. The smoke test asserts
that the encoder's controls are absent from the decoder page, which catches the
mistake early.

**`.npmrc` is not committed.** It is a local override for users behind a slow
route to the default registry. The lockfile resolves against
`registry.npmjs.org`, so CI is reproducible anywhere.

**`postcss` is overridden above the version Next pins.** Next 15.5 depends on
`postcss@8.4.31` exactly, which sits inside the advisory range for
`postcss <= 8.5.22` (unescaped `</style>` in stringified output, arbitrary file
read via `sourceMappingURL`, path traversal). The `overrides` block lifts it to
`^8.5.28` so a public repo does not carry a standing Dependabot alert. The bump
was verified inert here rather than assumed: rebuilding on 8.5.28 emits a
byte-identical stylesheet (same content hash) and byte-identical HTML once the
per-build `buildId` is masked out.

That conclusion rests on one property — this project has a single hand-written
stylesheet (`src/app/globals.css`) and no user-supplied CSS ever reaches the
pipeline. If that ever changes, re-evaluate before trusting the override.

**`EPERM` on `.next/trace` during a build.** On Windows, `next build` can die
between "compiled successfully" and "exporting", with

```
uncaughtException [Error: EPERM: operation not permitted, open '...\.next\trace']
```

The stack points at `next/dist/trace/report/to-json.js`. Its `RotatingWriteStream`
opens `.next/trace` with `flags: 'a'` and registers no `error` handler, so a
rejected `open` becomes an uncaught exception and kills the process — which is
why the symptom looks like a mystery failure with no `out/` written. Pre-creating
the directory and file narrows the race but does not remove it; the file is still
opened and written repeatedly throughout the build, and a concurrent lock (indexer,
real-time scanner) can still lose the race.

Next lets you switch the writes off. In `next/dist/trace/trace.js`, spans are only
reported when `duration > RECORD_SPAN_THRESHOLD_MS * 1000`, and the threshold
defaults to `-1` — so every span is reported. Raise it past any plausible build
duration and no event is ever emitted, no batch is created, and `.next/trace` is
never opened at all:

```bash
NEXT_TRACE_SPAN_THRESHOLD_MS=2147483647 npm run build
```

Verified on this repo: the build then completes and `.next/trace` does not exist
afterwards. Your own terminal may never hit this — it is a file-locking race, not
a project defect.

### License

Copyright 2026 llybood.

Apache License 2.0 — see [LICENSE](LICENSE). Attribution notices are in
[NOTICE](NOTICE), which also reproduces the MIT notice for the React and Next.js
runtime code bundled into the static export.

---

## 中文

### 这是什么

两个工具，各占一个页面：

- **图片转 Base64**（`/`）把图片转成 Base64 字符串，并给出真正需要配套的两样东西：
  带 Data URI 前缀的形式，以及原始文件与转换后文本的**真实体积对比**。
- **Base64 转图片**（`/base64-to-image/`）接收一段 Base64 字符串 —— 纯串、`data:`
  URI、带引号、包在 CSS `url(…)` 里都可以 —— 还原成一份可预览、可下载的真实二进制
  图片文件。

上面两个名字就是页头工具标签上的原文。用「转」而不是箭头是有意的：这两个标签是
两个**工具**，不是一条流程的两步；「图片 → Base64」会被读成一个需要访客自己解释的方向。

页头本身是一行：左边 20px 的词标，右边是两个工具标签与一个**收起的语言下拉**。下拉用
原生 `<details>` 承载真实的 `<a href>` 链接，而不是 `<select>` —— 渲染语言必须与
canonical / hreflang 声明的 URL 一致，而 select 会把导航放到 JavaScript 后面，这个站点的
语言机制是刻意只认 URL 的。触发器只说明这个控件**是什么**（「语言」），当前语言在下拉
内部打勾，因此新增语言时触发器的宽度不会变。窄屏下省略文字、由地球图标承担，整体换行到
第二行 —— 这两者都比把词标缩回成一个小标签更好。

它们是两个独立页面而不是同一页的两个标签，因为两者是被当作两簇不同查询来搜索的：
一个页面只有五个 H2 的承载力，而一个页面的 title 和 H1 也不可能同时领起两簇词。

除了工具本身，它还顺带是一个参考实现，针对的是多语言站点常见的坑：**把每种语言做成
各自的真实 URL，并在构建期就写死正确的 `<html lang>`、canonical 与 hreflang，全程
不靠 JavaScript 切换语言** —— 而这里的「每种语言」指的是每一个*语言 × 页面*组合，
hreflang 也必须指向**同一页面**的对应翻译，而不是语言根路径。

两个方向都不上传任何数据，转换全部在浏览器内完成。

### 功能

| 模块 | 说明 |
| --- | --- |
| **三种输入方式** | 点击选择、拖拽上传、剪贴板粘贴，另支持从图片 URL 远程加载 |
| **两种输出形式** | 带 Data URI 前缀（`data:image/png;base64,…`）与纯 Base64，标签页切换 |
| **不粉饰体积** | 同时显示原始大小、转换后文本体积与膨胀倍数 —— 决定是否内联之前先看清代价 |
| **一键复制 / 下载** | 复制带三级兜底；结果可导出为 `.txt`，文件名沿用来源名 |
| **解码** | 粘贴 Base64 字符串、Data URI、带引号的串或 `url(…)` 包裹，还原为图片 —— 带实时校验与真实二进制下载 |
| **格式判定** | 两个方向都按字节实测格式，不看标签。`data:` 前缀与字节签名冲突时以字节为准，并明确告知 |
| **完整三语** | 英、德、中三套界面，所有标题、按钮、占位文案、提示语与错误信息均已翻译；德文版连快捷键提示都做了本地化（`Strg+V`，而非 `Ctrl+V`） |
| **响应式** | 从 360 px 手机到宽屏桌面均可用 |
| **可访问性** | 使用真实的 `<button>` / `<a>` / `<label>`，标签页带 `aria-selected`，键盘可操作，焦点可见 |

### 支持的格式与使用边界

**编码**接受：PNG、JPEG、GIF、WebP、BMP、SVG、ICO。

**解码**接受：PNG、JPEG、GIF、WebP、BMP、SVG、ICO **与 AVIF** —— 比编码多一种。
原因是别人递过来的任何 Base64 字符串都应该能还原，不管它是用什么生成的，而 AVIF
恰恰是编码方向从来不需要接受的那种格式。

| 边界 | 数值 | 位置 |
| --- | --- | --- |
| 单文件最大 | 10 MB | `src/lib/convert.ts` 的 `MAX_BYTES` |
| 解码后最大 | 10 MB | `src/lib/decode.ts` 中由同一常量推导 |
| Base64 字符串上限 | 13,981,016 字符 | `src/lib/decode.ts` 的 `MAX_CHARS` |
| 单次拖入上限 | 20 个 | `MAX_FILES_PER_DROP` |
| 保留记录数 | 30 条 | `MAX_RECORDS` |

超大文件、非图片文件、URL 无效、加载失败、含非 Base64 字符、字符串被截断、体积
超限、解出的字节不是图片 —— 每一种都有针对性的提示文案，而不是一句笼统的失败。

### 实现要点

**转换。** `File` → `ArrayBuffer` → Base64。`btoa` 按 `0x8000` 字节分块调用，
因为把整个数兆字节的字符串一次性交给 `btoa` 会撑爆调用栈。

**格式判定。** 不信任 `File.type` —— 浏览器有时给错，改过扩展名的文件更是直接
说谎。改为嗅探文件头魔数，从而保证 Data URI 前缀不可能与实际载荷不一致。

**远程图片加载。** 两条路径，按序尝试：

1. `fetch(url)` → `arrayBuffer()`。能拿到精确字节数与真实体积，但要求对方服务端
   返回宽松的 CORS 头。
2. `<img>` + `<canvas>` —— 显示不需要 CORS，但除非对方允许，读回像素会污染
   canvas 并抛 `SecurityError`。

界面会明确告知实际走了哪条路径，因为第一种情况下体积是精确值、第二种是估算值。
需要精确数字的用户必须走第一条，也就必须知道自己何时没走上。

**剪贴板。** `navigator.clipboard` → `document.execCommand('copy')` → 在文档中
选中文本供手动复制。结果为 `copied` 或 `selected`，不会静默失败。

**解码。** 容易的那一半是 `atob`；难的那一半是判断解出来的字节**是什么**：纯
Base64 字符串不携带任何类型信息，而 `data:` 前缀是别人写下的标签，不是关于数据的
事实。所以：

- 先做规范化 —— 外层引号、`url(…)` 包裹、`data:` 前缀、换行、URL-safe 字母表与
  缺失的 `=` 补位，全部在读取第一个字节之前处理掉。只有真正不属于 Base64 的字符
  才会残留下来被报告。
- 长度上限在调用 `atob` **之前**判断。先解码一个 500 MB 的粘贴、再拒绝它，正是
  标签页耗尽内存的方式；而拿一个整数比较去拒绝是零成本的。
- 载荷长度为 `4n + 1` 在 Base64 里不可能存在，因此会被报告为「字符串被截断」，
  而不是含糊的解码失败。
- 格式来自开头字节 —— PNG 的完整签名、JPEG 的 `FF D8 FF`、WebP 的 RIFF 头、
  AVIF 则要读 ISO 基础媒体盒子里的 brand 列表。SVG 是标记语言而非像素，按文本
  识别。

完整的校验顺序见 `decode.ts` 的文件头注释。

**解出的 SVG 永远不会被内联。**它只通过指向 blob URL 的 `<img>` 预览，脚本在其中
不会执行。把解码出的 SVG 标记直接渲染进文档，是让解码器变成 XSS 入口的经典做法。

### 开始使用

需要 **Node.js 18.18+**（推荐 20 LTS 或更新）。

```bash
npm install
npm run dev        # http://localhost:3000                        英文页 · 图片 → Base64
                   # http://localhost:3000/base64-to-image/       英文页 · Base64 → 图片
                   # http://localhost:3000/de/                    德文页 · 图片 → Base64
                   # http://localhost:3000/de/base64-to-image/    德文页 · Base64 → 图片
                   # http://localhost:3000/zh/                    中文页 · 图片 → Base64
                   # http://localhost:3000/zh/base64-to-image/    中文页 · Base64 → 图片
```

构建静态站点：

```bash
SITE_URL=https://你的域名 npm run build
```

产物输出到 `out/`，用任意静态服务托管即可：

```bash
npm run preview    # npx serve out
```

Windows 用户、或不习惯 `变量=值 命令` 这种写法的话，把 `.env.example` 复制为
`.env.production`，在文件里设置域名即可 —— Next.js 构建时会自动加载它，
`.gitignore` 也已经把它排除在外。

### 校验

两套互相独立的校验，都必须通过：

```bash
npm run verify   # 针对构建产物的 319 项检查
npm run smoke    # 真实无头浏览器中的 156 项检查
npm run check    # 依次串跑两者
```

`verify-seo.mjs` 读取 `out/`，对**每一个「页面 × 语言」组合**（当前共六个）逐项断言：
目标词在正文与标题两层是否命中、title/description 的**像素宽度**（字符数对中文有
严重误导）、canonical 指向该页面自己的路径、`<html lang>`、有且仅有一个 `<h1>`、
`<h2>` 不少于 5 个、Open Graph 与 Twitter 标签、可索引性、JSON-LD 可解析且类型
正确并**刻意不含** `aggregateRating`、跨语言互链、当前语言的 `aria-current`。

其中值得单独说明的是 hreflang 断言。三个语言码都必须指向**本页面的对应翻译** ——
反向页的 `hreflang="de"` 是 `/de/base64-to-image/`，而不是 `/de/`；`x-default` 必须
指向默认语言下的**本页面**。此外还有一条显式断言：反向页的任何 hreflang 都不得指向
语言根路径，因为这正是「按页面配对」这套路由要防的具体事故。sitemap 用同样的方式
校验：六个 `<url>` 块各自必须与自己的页面对应，因此「列了六个 URL 却给它们同一个
alternates 块」这种写法会直接失败。若产物仍带占位域名，脚本以非零码退出。

`smoke.mjs` 自起静态服务，用 Node 内置 WebSocket 直连 DevTools 协议驱动无头 Chrome，
并且**比对字节而非字符串**。编码套件在三个语言页各跑一遍，覆盖 PNG 与 SVG 输入、
URL 远程加载、无效 URL 与非图片文件的告警、水合是否真的发生，以及全程控制台无报错。
解码套件同样在三个语言页各跑一遍，覆盖纯 Base64、前缀与字节相矛盾的 Data URI、
带引号且折行且 URL-safe 且缺补位的字符串、被截断的字符串、能解码但不是图片的内容，
以及清空后回到初始态 —— 读取方式是从预览 `<img>` 自己的对象 URL 取回字节，因此量到
的就是用户会下载到的那份产物。

最有分量的一项是**跨工具往返**：一张真实的 2433 字节 PNG 进入编码工具，它产出的
Data URI 以用户的方式被带到解码工具，出来的字节与原文件逐字节比对。两个工具都
不被单独信任 —— 只有双方一致这项检查才会通过。

页头另有 1440px 与 360px 两轮实测，因为它是页面里最容易写错、也最不容易被察觉的部分。
1440px 下断言词标与右侧整体真的共处一行、词标起点等于容器左边界、下拉终点等于容器
右边界，以及词标字号不小于 18px —— 「截图里看着变大了」不算检查。360px 下断言下拉默认
收起、三条语言项都指向**本页面**各自的翻译且无一指向语言根，然后按访客的方式驱动这个
折叠：点击展开、点击外部收起、按 Esc 收起。两轮真正吃重的断言都是文档绝不出现横向滚动。
零第三方依赖。

SEO 全绿不代表工具能用，这套就是补这个缺口。

### 工程结构

```
src/
├── app/
│   ├── (en)/layout.tsx                        根 layout，持有 <html lang="en">
│   ├── (en)/page.tsx                          →  /                         图片 → Base64
│   ├── (en)/base64-to-image/page.tsx          →  /base64-to-image/         Base64 → 图片
│   ├── (de)/layout.tsx, de/page.tsx           →  /de/、/de/base64-to-image/
│   ├── (zh)/layout.tsx, zh/page.tsx           →  /zh/、/zh/base64-to-image/
│   ├── globals.css                            唯一样式源
│   ├── robots.ts, sitemap.ts                  文件约定式生成，force-static
├── components/
│   ├── Shell.tsx                              持有 <html lang> —— 绝不被 JS 改写
│   ├── Nav.tsx, Hero.tsx, JsonLd.tsx, Markup.tsx
│   ├── LangMenu.tsx                           页头的语言折叠菜单
│   ├── Workspace.tsx                          编码工具的 "use client" 边界
│   ├── tool/
│   │   ├── Decoder.tsx                        解码工具的 "use client" 边界
│   │   ├── UploadCard / ResultCard / SideColumn          编码界面
│   │   ├── PasteCard / DecodedCard / DecodeSideColumn    解码界面
│   │   ├── useConverter.ts、useDecoder.ts      两个状态机
│   │   └── useToasts.ts、Toasts.tsx、Icons.tsx
│   └── sections/                              长文内容；每个 <h2> 承载一个目标词，
│                                              按页面 × 语言分别成篇
├── lib/
│   ├── site.ts                                ★ 域名、LANGS、PAGES、pagePath()、
│   │                                          目标词、title/description
│   ├── dict.ts                                界面文案；en 以 zh 为类型约束，
│   │                                          漏译一个键就会构建失败
│   ├── faq.ts                                 按页面 × 语言分表；折叠面板与
│   │                                          FAQPage 结构化数据的单一源
│   ├── convert.ts                             编码内核，只抛错误**码**不抛文案
│   └── decode.ts                              解码内核：规范化、字节嗅探与四层校验
public/                                        favicon、apple-touch-icon、OG 图
scripts/                                       verify-seo.mjs、smoke.mjs
legacy-static/                                 v1 单文件版本归档
```

几个容易被误读为「缺失功能」的设计决定，需要说明：

**语言由 URL 决定，不由 JavaScript 决定。** 每个 route group 拥有自己的根
layout，因此 `<html lang>` 是构建期属性。既不读 `localStorage`，也不嗅探
`navigator.language`。加上其中任何一个，都会让实际渲染语言与同一份文档里声明的
hreflang / canonical 不一致 —— 而这正是当前结构存在的意义。

**一个 URL 是「语言 × 页面」的组合，不是一个语言。** 英文是默认语言，因此它占根路径
`/`，正向工具占据每种语言的根路径，反向工具则位于其下一级目录。这个组合只在
`src/lib/site.ts` 的 `pagePath(lang, page)` 一个函数里拼装，并且**刻意不再保留**按
语言索引的 `PATHS` 表：那种查表无法表达「同一页面的另一种语言」，于是每一个悄悄退化成
语言根路径的调用点，都会恰好变成这套模型要防的那个 bug。调用方必须写明自己指的是哪个
页面。

两个单一的清单存放在 `src/lib/site.ts` 的 `LANGS` 与 `PAGES` 中：hreflang 集合、
sitemap 条目、Open Graph 的备用 locale、两个切换器与页面 head 全部由它们生成，因此
不会出现「有路由却没被声明」或「声明了却没有路由」的情况。`x-default` 指向默认语言下
**当前页面**的副本 —— 页面 head 与 sitemap 两处都是。

`LANGS` 的顺序即语言切换器的渲染顺序，所以调整哪种语言排第二是一行改动。hreflang
集合与 sitemap 条目本身不带顺序语义，因此重排无需在其他任何地方配套修改 —— 变的只是
切换器上可见的先后。

另有三处无法由值推导、必须手工同步：route group 目录（这是文件系统事实）、与之
对应的 `DECODE_SLUG` 常量（必须与目录名一致），以及 `scripts/verify-seo.mjs` 顶部
镜像的路由表（刻意重复，以使产物不由生产它的代码来认证）。任何一处没跟上，
`npm run verify` 都会以非零码退出。

**metadata 声明在各个页面，绝不放在 route group 的 layout 上。** 现在每个语言分组
服务两个页面，而 layout 的 `export const metadata` 会被组内**所有**页面继承 —— 放在
layout 上的 canonical 会让两个不同 URL 都声称自己是同一个页面。这是本项目里唯一一条
对「一组多页」而言实际上是错误约定的 Next.js 惯例。

**德文采用非正式的 "du"**，与英文页直呼 "you" 的语气一致，也符合开发者工具的习惯。
快捷键提示与正文一起做了本地化 —— 是 `Strg+V` 而不是 `Ctrl+V`，后者在德语键盘上是
错的标签。若要改成 "Sie"，等于重写 `dict.ts`、`faq.ts` 与两个德文长文组件里的每一条
文案，不是查找替换：动词变位与物主代词都会随人称改变。

**`lib/convert.ts` 与 `lib/decode.ts` 只抛错误码，不抛文案。** 它们被三种语言共用，
面向用户的文案归属 `dict.ts`。两个文件也都没有 `"use client"` 指令，因此服务端渲染的
路径同样能用它们。

### 部署

导出的 `out/` 就是普通静态文件，托管在哪儿都行：Nginx 或 Apache、Cloudflare
Pages、Vercel、Netlify、对象存储接 CDN、GitHub Pages。

有三件事需要留意：

1. **构建时必须设置 `SITE_URL`。** 它供 canonical、hreflang、Open Graph、
   sitemap 与 JSON-LD 使用。不设置则构建给出警告、校验脚本直接失败 —— 因为一个
   canonical 指向 `example.com` 的站点，等于在告诉搜索引擎「真正的页面在别处」。
2. **必须部署在域名根路径下。** 资源以 `/_next/…` 绝对路径解析。子路径托管
   （例如 GitHub Pages 的**项目**站点 `/仓库名/`）需要在 `next.config.mjs` 中配置
   与之匹配的 `basePath` 与 `assetPrefix`，且 `SITE_URL` 也要带上同样的路径。
   用户或组织级 Pages 站点绑定自有域名并位于根路径时，则无需改动。
3. **托管方需支持干净的 URL。** `trailingSlash: true` 意味着非默认语言的产物是
   `base64-to-image/index.html`、`de/index.html`、`de/base64-to-image/index.html`
   等，访问路径为 `/base64-to-image/`、`/de/`、`/de/base64-to-image/`。确认目录索引
   可用，才是六个页面都能访问、而不是只有英文根路径能访问的关键。

### 已知的坑

**TypeScript 必须锁在 5.x。** 装成 7.x（原生 Go 重写版）会让 Next 15.5 **静默**
读不到 `tsconfig.json` 里的 `paths`。症状极具误导性：报
`Module not found: '@/components/Hero'`，看不出问题出在别名，而且
`next-env.d.ts` 根本不会生成。版本因此锁定为 `^5.9`。

**`paths` 必须配合 `baseUrl`。** 缺 `"baseUrl": "."` 时 `@/*` 别名不生效。

**`next-env.d.ts` 不提交。** 它内部引用 `./.next/types/routes.d.ts`，该文件在全新
clone 里并不存在，Next 会自动重新生成。

**路由改动后必须删掉 `out/` 再重建。** Next 的导出是写进已有目录，而不是替换它，
所以删掉一个页面、或改掉它的 slug 之后，旧的 `index.html` 会原样留着，而校验脚本会
开开心心地去检查一个路由已经不认识的页面。只要路由集合有变化，
`rm -rf out && npm run build` 才是诚实的顺序。

**route group 的 layout metadata 会被组内每个页面继承。** 既然每个语言分组服务两个
页面，写在 `(en)/layout.tsx` 上的 `export const metadata` 就会被两个页面同时应用，
两者都会输出同一个 canonical URL —— 等于在告诉搜索引擎「其中一个页面不存在」。正因
如此 metadata 才逐页声明，layout 里只留 `viewport`。layout 上导出的其他任何东西同理。

**不要让两个工具都注册 document 级 `paste` 监听。** 两个状态机都监听 `document`，
这样在页面任意位置粘贴都能生效。它们被挂在各自独立的页面上，正是为了保证任何时候
只有一个处于激活状态；把两个工具放进同一个页面，会让它们争抢同一个事件。冒烟测试会
断言解码页上不存在编码工具的那些控件，从而尽早拦住这个错误。

**`.npmrc` 不提交。** 它是给「本机到默认源链路很慢」的用户准备的本地覆盖。
lockfile 统一解析到 `registry.npmjs.org`，因此在任何 CI 上都可复现。

**`postcss` 被覆盖到高于 Next 锁定的版本。** Next 15.5 精确依赖
`postcss@8.4.31`，正好落在 `postcss <= 8.5.22` 的公告影响区间内（stringify
输出未转义 `</style>`、经 `sourceMappingURL` 读取任意文件、路径穿越）。
`overrides` 把它抬到 `^8.5.28`，避免公开仓库长期挂着一个 Dependabot 告警。
这个升级在本项目是否安全，是**实测**而非推断的：用 8.5.28 重建后样式表逐字节
相同（内容哈希一致），HTML 在掩盖每次构建的 `buildId` 后同样逐字节相同。

该结论成立的前提只有一条 —— 本项目只有一份手写样式表
（`src/app/globals.css`），没有任何用户可控的 CSS 进入这条管线。若前提变了，
先重新评估再沿用这个覆盖。

**构建时 `.next/trace` 报 `EPERM`。** Windows 上 `next build` 可能死在
「编译成功」与「开始导出」之间：

```
uncaughtException [Error: EPERM: operation not permitted, open '...\.next\trace']
```

堆栈指向 `next/dist/trace/report/to-json.js`。它的 `RotatingWriteStream` 以
`flags: 'a'` 打开 `.next/trace`，且**没有注册 `error` 监听** —— open 一旦被拒就变成
未捕获异常、直接打死进程。所以症状看起来像莫名其妙的失败，而 `out/` 不产出。

预建目录与文件只能缩小竞争窗口、不能消除它：这个文件在构建全程被反复打开写入，
索引器或实时扫描仍可能抢到锁。

Next 留了一个关掉这条写入的开关。`next/dist/trace/trace.js` 里，span 仅在
`duration > RECORD_SPAN_THRESHOLD_MS * 1000` 时才上报，而阈值默认 `-1` ——
等于每一个 span 都上报。把它抬到超过任何可信的构建时长，就再也不会上报任何事件、
不会创建批次、`.next/trace` **根本不会被打开**：

```bash
NEXT_TRACE_SPAN_THRESHOLD_MS=2147483647 npm run build
```

本仓库已实测：构建正常完成，且事后 `.next/trace` 不存在。你自己的终端可能从不触发
这个问题 —— 它是文件锁竞争，不是项目缺陷。

### 许可证

Copyright 2026 llybood。

Apache License 2.0 —— 见 [LICENSE](LICENSE)。署名声明见 [NOTICE](NOTICE)，
其中同时转载了打包进静态产物的 React 与 Next.js 运行时代码所适用的 MIT 声明。
