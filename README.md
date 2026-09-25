# Image to Base64

[English](#english) · [中文](#中文)

A browser-side image → Base64 converter, built as a fully static Next.js site with
three independently indexable language pages — English at `/`, German at `/de/`
and Chinese at `/zh/`.

一个纯浏览器端运行的「图片转 Base64」工具，以 Next.js 全静态导出，英、德、中三语各占一个可独立被搜索引擎索引的页面（英文在 `/`、德文在 `/de/`、中文在 `/zh/`）。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

---

## English

### What it is

A tool that turns an image into a Base64 string — plus the two things people
actually need alongside it: the Data URI form, and a truthful size comparison
between the original file and the resulting text.

It also happens to be a reference implementation of a problem that trips up a lot
of multilingual sites: **serving every language as its own real URL, with correct
`<html lang>`, canonical and hreflang at build time, without any client-side
language swapping.**

Nothing is uploaded. Conversion happens entirely in the browser.

### Features

| Area | What it does |
| --- | --- |
| **Three input paths** | Click to select, drag & drop, or paste from the clipboard — plus loading a remote image from a URL |
| **Two output forms** | Data URI (`data:image/png;base64,…`) and raw Base64, switched by tab |
| **Honest size reporting** | Shows the original byte size, the resulting text size, and the growth factor — so the trade-off is visible before you commit to inlining |
| **One-click copy / download** | Copy with a three-tier fallback; download the result as a `.txt` file named after the source |
| **Trilingual** | Complete en, de and zh-CN UI; every label, placeholder, toast and error message is translated — the German build localises even the key hints (`Strg+V`, not `Ctrl+V`) |
| **Responsive** | Works from a 360 px phone up to a wide desktop |
| **Accessible** | Real `<button>` / `<a>` / `<label>` elements, `aria-selected` tabs, keyboard-operable, visible focus |

### Supported formats and limits

Accepted: **PNG, JPEG, GIF, WebP, BMP, SVG, ICO**.

| Limit | Value | Where |
| --- | --- | --- |
| Max size per file | 10 MB | `MAX_BYTES` in `src/lib/convert.ts` |
| Max files per drop | 20 | `MAX_FILES_PER_DROP` |
| Max records kept | 30 | `MAX_RECORDS` |

Oversized files, non-image files, invalid URLs and failed loads each produce a
specific, translated message rather than a generic failure.

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

### Getting started

Requires **Node.js 18.18+** (20 LTS or newer recommended).

```bash
npm install
npm run dev        # http://localhost:3000      (en — the default language)
                   # http://localhost:3000/de/  (de)
                   # http://localhost:3000/zh/  (zh)
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
npm run verify   # 160 checks over the built HTML
npm run smoke    # 60 checks in a real headless browser
npm run check    # both, in order
```

`verify-seo.mjs` reads `out/` and asserts, per language: keyword coverage in both
body and headings, title/description *pixel width* (not character count, which is
misleading for CJK), canonical suffix, the full hreflang set with each code
pointing at its own URL, `<html lang>`,
exactly one `<h1>`, ≥5 `<h2>`, Open Graph and Twitter tags, indexability,
parseable JSON-LD with the expected types and the deliberate absence of
`aggregateRating`, cross-language links, and `aria-current` on the active
language. It exits non-zero if the build still carries the placeholder domain.

`smoke.mjs` starts its own static server, drives headless Chrome over the
DevTools Protocol using Node's built-in WebSocket, and **compares bytes rather
than strings**: the original file goes in, the Base64 on the page is decoded, and
the two are compared byte for byte. The full suite runs on each of the three
language pages. It covers PNG and SVG input, remote-URL loading, the invalid-URL
and non-image warnings, whether hydration actually happened, and that the console
stays clean throughout. It also re-measures the header at 360 px: the language
switcher gains a pill per language, and a single non-wrapping flex row is exactly
what a newly added language overflows. Zero third-party dependencies.

SEO checks passing does not mean the tool works. This suite covers that gap.

### Project structure

```
src/
├── app/
│   ├── (en)/layout.tsx, page.tsx     →  /        (English — the default)
│   ├── (de)/layout.tsx, de/page.tsx  →  /de/     (German page)
│   ├── (zh)/layout.tsx, zh/page.tsx  →  /zh/     (Chinese page)
│   ├── globals.css                   single source of truth for styling
│   ├── robots.ts, sitemap.ts         file-convention generators, force-static
├── components/
│   ├── Shell.tsx                     owns <html lang> — never rewritten by JS
│   ├── Nav.tsx, Hero.tsx, JsonLd.tsx, Markup.tsx
│   ├── Workspace.tsx                 the only "use client" boundary
│   ├── tool/                         UploadCard, ResultCard, SideColumn, Toasts,
│   │                                 Icons, and useConverter (the state machine)
│   └── sections/                     long-form content; each <h2> carries a
│                                     target query
├── lib/
│   ├── site.ts                       ★ domain, language list, target queries,
│   │                                 title/description
│   ├── dict.ts                       UI strings; en is typed against zh, so a
│   │                                 missing translation fails the build
│   ├── faq.ts                        one source for both the accordion and the
│   │                                 FAQPage structured data
│   └── convert.ts                    framework-free conversion core; reports
│                                     error *codes*, never prose
public/                               favicon, apple-touch-icon, OG image
scripts/                              verify-seo.mjs, smoke.mjs
legacy-static/                        the v1 single-file version, archived
```

Three design choices worth calling out, because they look like omissions:

**Language is determined by the URL, not by JavaScript.** Each route group has
its own root layout, so `<html lang>` is a build-time attribute. There is no
`localStorage` preference and no `navigator.language` sniffing. Adding either
would let the rendered language disagree with the hreflang and canonical tags
declared in the same document — which is exactly the bug this structure exists to
avoid.

**English is the default language**, so it is served from `/` and is what the
`x-default` hreflang annotation names — in the page head and in the sitemap
alike. German lives at `/de/`, Chinese at `/zh/`.

The language list lives in exactly one place, `LANGS` in `src/lib/site.ts`: the
hreflang set, the sitemap entries, the Open Graph alternate locales and the
language switcher are all generated from it, so a language cannot end up routed
but unadvertised — or advertised but unrouted.

The order of that array is the order the switcher renders, so changing which
language comes second is a one-line edit. hreflang sets and sitemap entries
carry no ordering semantics, which is why a reorder needs no matching change
anywhere else — only the switcher's visible sequence moves.

Two things cannot be derived from a value and must be edited by hand: the route
group directory, which is a filesystem fact, and the mirrored `PATHS` table in
`scripts/verify-seo.mjs`, which is duplicated on purpose so the deliverable is
not certified by the code that produced it. `npm run verify` asserts that every
language's hreflang points at its own URL and that `x-default` follows
`DEFAULT_LANG`, so a half-finished language addition fails the check instead of
shipping quietly.

**German is written in the informal "du"**, matching the direct "you" of the
English page and the tone of developer tooling. The key hints are localised along
with the prose — `Strg+V`, not `Ctrl+V`, which would be the wrong label on a
German keyboard. Switching to "Sie" is a rewrite of every string in `dict.ts`,
`faq.ts` and `GuideDe.tsx`, not a find-and-replace: verb forms and possessives
change with the pronoun.

**`lib/convert.ts` throws error codes, not messages.** It is shared by all three
languages, so user-facing prose belongs in `dict.ts`. It also has no `"use client"`
directive, which keeps it usable from server-rendered code.

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
3. **Support clean URLs.** `trailingSlash: true` means the Chinese and German pages
   are `zh/index.html` and `de/index.html`, reached at `/zh/` and `/de/`. Confirm
   your host serves directory indexes.

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

### License

Copyright 2026 llybood.

Apache License 2.0 — see [LICENSE](LICENSE). Attribution notices are in
[NOTICE](NOTICE), which also reproduces the MIT notice for the React and Next.js
runtime code bundled into the static export.

---

## 中文

### 这是什么

把图片转成 Base64 字符串的工具 —— 同时给出真正需要配套的两样东西：带 Data URI
前缀的形式，以及原始文件与转换后文本的**真实体积对比**。

它还顺带是一个参考实现，针对的是多语言站点常见的坑：**把每种语言做成各自的真实
URL，并在构建期就写死正确的 `<html lang>`、canonical 与 hreflang，全程不靠
JavaScript 切换语言。**

不上传任何文件，转换全部在浏览器内完成。

### 功能

| 模块 | 说明 |
| --- | --- |
| **三种输入方式** | 点击选择、拖拽上传、剪贴板粘贴，另支持从图片 URL 远程加载 |
| **两种输出形式** | 带 Data URI 前缀（`data:image/png;base64,…`）与纯 Base64，标签页切换 |
| **不粉饰体积** | 同时显示原始大小、转换后文本体积与膨胀倍数 —— 决定是否内联之前先看清代价 |
| **一键复制 / 下载** | 复制带三级兜底；结果可导出为 `.txt`，文件名沿用来源名 |
| **完整三语** | 英、德、中三套界面，所有标题、按钮、占位文案、提示语与错误信息均已翻译；德文版连快捷键提示都做了本地化（`Strg+V`，而非 `Ctrl+V`） |
| **响应式** | 从 360 px 手机到宽屏桌面均可用 |
| **可访问性** | 使用真实的 `<button>` / `<a>` / `<label>`，标签页带 `aria-selected`，键盘可操作，焦点可见 |

### 支持的格式与使用边界

接受：**PNG、JPEG、GIF、WebP、BMP、SVG、ICO**。

| 边界 | 数值 | 位置 |
| --- | --- | --- |
| 单文件最大 | 10 MB | `src/lib/convert.ts` 的 `MAX_BYTES` |
| 单次拖入上限 | 20 个 | `MAX_FILES_PER_DROP` |
| 保留记录数 | 30 条 | `MAX_RECORDS` |

超大文件、非图片文件、URL 无效、加载失败 —— 每一种都有针对性的提示文案，而不是
一句笼统的失败。

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

### 开始使用

需要 **Node.js 18.18+**（推荐 20 LTS 或更新）。

```bash
npm install
npm run dev        # http://localhost:3000      英文页（默认语言）
                   # http://localhost:3000/de/  德文页
                   # http://localhost:3000/zh/  中文页
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
npm run verify   # 针对构建产物的 160 项检查
npm run smoke    # 真实无头浏览器中的 60 项检查
npm run check    # 依次串跑两者
```

`verify-seo.mjs` 读取 `out/`，逐语言断言：目标词在正文与标题两层是否命中、
title/description 的**像素宽度**（字符数对中文有严重误导）、canonical 后缀、
完整的 hreflang 集合（且每个语言码都指向自己的 URL）、`<html lang>`、有且仅有一个 `<h1>`、`<h2>` 不少于 5 个、
Open Graph 与 Twitter 标签、可索引性、JSON-LD 可解析且类型正确并**刻意不含**
`aggregateRating`、跨语言互链、当前语言的 `aria-current`。若产物仍带占位域名，
脚本以非零码退出。

`smoke.mjs` 自起静态服务，用 Node 内置 WebSocket 直连 DevTools 协议驱动无头
Chrome，并且**比对字节而非字符串**：原文件进去，把页面上的 Base64 解出来，逐字节
比对。三个语言页各跑一遍完整的检查项。覆盖 PNG 与 SVG 输入、URL 远程加载、无效
URL 与非图片文件的告警、水合是否真的发生，以及全程控制台无报错。它还会在 360 px
宽度下重新实测一次页头：语言切换器每加一种语言就多一个按钮，而页头正是一条
不换行的 flex 行 —— 这正是新增语言最容易撑破的地方。零第三方依赖。

SEO 全绿不代表工具能用，这套就是补这个缺口。

### 工程结构

```
src/
├── app/
│   ├── (en)/layout.tsx, page.tsx     →  /        英文页（默认语言）
│   ├── (de)/layout.tsx, de/page.tsx  →  /de/     德文页
│   ├── (zh)/layout.tsx, zh/page.tsx  →  /zh/     中文页
│   ├── globals.css                   唯一样式源
│   ├── robots.ts, sitemap.ts         文件约定式生成，force-static
├── components/
│   ├── Shell.tsx                     持有 <html lang> —— 绝不被 JS 改写
│   ├── Nav.tsx, Hero.tsx, JsonLd.tsx, Markup.tsx
│   ├── Workspace.tsx                 唯一的 "use client" 边界
│   ├── tool/                         UploadCard、ResultCard、SideColumn、
│   │                                 Toasts、Icons 与状态机 useConverter
│   └── sections/                     长文内容；每个 <h2> 承载一个目标词
├── lib/
│   ├── site.ts                       ★ 域名、语言清单、目标词、title/description
│   ├── dict.ts                       界面文案；en 以 zh 为类型约束，
│   │                                 漏译一个键就会构建失败
│   ├── faq.ts                        折叠面板与 FAQPage 结构化数据的单一源
│   └── convert.ts                    框架无关的转换内核，只抛错误**码**不抛文案
public/                               favicon、apple-touch-icon、OG 图
scripts/                              verify-seo.mjs、smoke.mjs
legacy-static/                        v1 单文件版本归档
```

三个容易被误读为「缺失功能」的设计决定，需要说明：

**语言由 URL 决定，不由 JavaScript 决定。** 每个 route group 拥有自己的根
layout，因此 `<html lang>` 是构建期属性。既不读 `localStorage`，也不嗅探
`navigator.language`。加上其中任何一个，都会让实际渲染语言与同一份文档里声明的
hreflang / canonical 不一致 —— 而这正是当前结构存在的意义。

**英文为默认语言**，因此它占根路径 `/`，并成为 `x-default` hreflang 的指向
目标 —— 页面 head 与 sitemap 两处都是。德文位于 `/de/`，中文位于 `/zh/`。

语言清单只在 `src/lib/site.ts` 的 `LANGS` 一处声明：hreflang 集合、sitemap 条目、
Open Graph 的备用 locale 与语言切换器全部由它生成，因此不会出现「有路由却没被
声明」或「声明了却没有路由」的语言。

该数组的顺序即语言切换器的渲染顺序，所以调整哪种语言排第二是一行改动。hreflang
集合与 sitemap 条目本身不带顺序语义，因此重排无需在其他任何地方配套修改 —— 变的
只是切换器上可见的先后。

另有两处无法由值推导、必须手工同步：route group 目录（这是文件系统事实），以及
`scripts/verify-seo.mjs` 中镜像的 `PATHS` 表（刻意重复，以使产物不由生产它的代码
来认证）。`npm run verify` 会断言每种语言的 hreflang 都指向自己的 URL、且
`x-default` 跟随 `DEFAULT_LANG`，因此半途而废的新增语言会在校验环节失败，而不会
悄无声息地上线。

**德文采用非正式的 "du"**，与英文页直呼 "you" 的语气一致，也符合开发者工具的习惯。
快捷键提示与正文一起做了本地化 —— 是 `Strg+V` 而不是 `Ctrl+V`，后者在德语键盘上
是错的标签。若要改成 "Sie"，等于重写 `dict.ts`、`faq.ts` 与 `GuideDe.tsx` 里的
每一条文案，不是查找替换：动词变位与物主代词都会随人称改变。

**`lib/convert.ts` 只抛错误码，不抛文案。** 它被三种语言共用，面向用户的文案归属
`dict.ts`。该文件也没有 `"use client"` 指令，因此服务端渲染的路径同样能用它。

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
3. **托管方需支持干净的 URL。** `trailingSlash: true` 意味着中文页与德文页产物是
   `zh/index.html` 与 `de/index.html`，访问路径为 `/zh/` 与 `/de/`，请确认目录索引可用。

### 已知的坑

**TypeScript 必须锁在 5.x。** 装成 7.x（原生 Go 重写版）会让 Next 15.5 **静默**
读不到 `tsconfig.json` 里的 `paths`。症状极具误导性：报
`Module not found: '@/components/Hero'`，看不出问题出在别名，而且
`next-env.d.ts` 根本不会生成。版本因此锁定为 `^5.9`。

**`paths` 必须配合 `baseUrl`。** 缺 `"baseUrl": "."` 时 `@/*` 别名不生效。

**`next-env.d.ts` 不提交。** 它内部引用 `./.next/types/routes.d.ts`，该文件在全新
clone 里并不存在，Next 会自动重新生成。

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

### 许可证

Copyright 2026 llybood。

Apache License 2.0 —— 见 [LICENSE](LICENSE)。署名声明见 [NOTICE](NOTICE)，
其中同时转载了打包进静态产物的 React 与 Next.js 运行时代码所适用的 MIT 声明。
