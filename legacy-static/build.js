#!/usr/bin/env node
/* ============================================================================
 * build.js — Base64 Studio static site builder
 * ----------------------------------------------------------------------------
 * index.html is the single source of truth (Chinese, served at "/").
 * From it this script derives everything else:
 *
 *   1. injects SITE_URL into every absolute URL,
 *   2. generates /en/index.html by translating each data-i18n node with the
 *      I18N.en dictionary that already lives inside the page,
 *   3. regenerates sitemap.xml and robots.txt.
 *
 * There is no bundler, no dependency, and no second template. The English page
 * is a translation of the Chinese one, so the two can never structurally drift.
 *
 * USAGE
 *   node build.js                                # keep current domain
 *   node build.js https://your-domain.com        # set / change domain
 *   SITE_URL=https://your-domain.com node build.js
 *
 * The active domain is stored in index.html as a `<!-- SITE_URL: ... -->`
 * marker. Re-running with a new domain rewrites every URL in every file.
 * ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

/* ============================================================
   Paths
   ============================================================ */
const ROOT = __dirname;
const SRC_FILE = path.join(ROOT, "index.html");
const EN_DIR = path.join(ROOT, "en");
const EN_FILE = path.join(EN_DIR, "index.html");
const SITEMAP_FILE = path.join(ROOT, "sitemap.xml");
const ROBOTS_FILE = path.join(ROOT, "robots.txt");

const FALLBACK_DOMAIN = "https://example.com";
const MARKER_RE = /<!--\s*SITE_URL:\s*(\S+?)\s*-->/;

/* Illustrative URL inside input placeholders. It is an example, not this site,
   so it is deliberately shielded from the domain rewrite. */
const EXAMPLE_IMAGE_URL = "https://example.com/pic.png";
const SENTINEL = "\u0000EXAMPLE_URL\u0000";

/* ============================================================
   Configuration
   ============================================================ */
const SITE_URL = (process.argv[2] || process.env.SITE_URL || FALLBACK_DOMAIN)
  .trim()
  .replace(/\/+$/, "");

const IS_PLACEHOLDER = SITE_URL === FALLBACK_DOMAIN;

/* Local calendar date rather than toISOString(): the UTC form reports
   yesterday for any build run after local midnight in a positive-offset
   timezone, which would make <lastmod> appear to move backwards. */
const NOW = new Date();
const TODAY =
  NOW.getFullYear() +
  "-" +
  String(NOW.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(NOW.getDate()).padStart(2, "0");

/* English copy that is not part of the page dictionary (head metadata). */
const EN_META = {
  description:
    "Convert JPG, PNG, GIF, WebP or SVG into Base64 and Data URI online. See the image format, original size and size increase. Everything runs in your browser — nothing is uploaded.",
  ogImageAlt:
    "The Base64 Studio interface: converting an image to Base64 and Data URI, entirely in the browser",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Base64 Studio — Image to Base64",
    alternateName: "图片转 Base64",
    url: SITE_URL + "/en/",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: "en",
    isAccessibleForFree: true,
    description:
      "Free online tool that converts JPG, PNG, GIF, WebP and SVG images into Base64 and Data URI strings, showing the image format, original size and size increase. Everything runs locally in your browser.",
    featureList: [
      "Pick, drag-and-drop or paste a local image from the clipboard",
      "Load an image from a URL, with clear guidance when CORS blocks it",
      "Output both Data URI and raw Base64 in one pass",
      "One-click copy and download as .txt",
      "Bilingual Chinese and English interface",
      "Runs entirely in the browser — images are never uploaded",
    ],
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
};

/* ============================================================
   Helpers
   ============================================================ */
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escAttr = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const warnings = [];
const warn = (m) => warnings.push(m);

/** Replace the content="" of a <meta> identified by name= or property=. */
function setMeta(html, key, value) {
  const re = new RegExp(
    '((?:name|property)="' + escRe(key) + '"[^>]*?content=")([^"]*)(")'
  );
  if (!re.test(html)) {
    warn('meta tag not found: ' + key);
    return html;
  }
  return html.replace(re, (m, a, _old, c) => a + escAttr(value) + c);
}

/** Replace the href of <link rel="canonical">. */
function setCanonical(html, url) {
  const re = /(<link rel="canonical" href=")([^"]*)(")/;
  if (!re.test(html)) {
    warn("canonical link not found");
    return html;
  }
  return html.replace(re, (m, a, _old, c) => a + url + c);
}

/** Replace the text inside <title>. */
function setTitle(html, text) {
  return html.replace(
    /(<title[^>]*>)([\s\S]*?)(<\/title>)/,
    (m, a, _old, c) => a + escAttr(text) + c
  );
}

/** Replace the body of the JSON-LD block. */
function setJsonLd(html, obj) {
  const re = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/;
  if (!re.test(html)) {
    warn("JSON-LD block not found");
    return html;
  }
  const body = JSON.stringify(obj, null, 2).replace(/<\//g, "<\\/");
  return html.replace(re, (m, a, _old, c) => a + "\n" + body + "\n" + c);
}

/**
 * Replace every data-i18n element's text and every data-i18n-placeholder
 * attribute value using `dict`.
 */
function localizeMarkup(fragment, dict) {
  let out = fragment.replace(
    /(<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\sdata-i18n="([A-Za-z0-9_]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (full, open, _tag, key, _inner, close) => {
      const v = dict[key];
      if (v === undefined) {
        warn('missing "' + key + '" in target dictionary');
        return full;
      }
      return open + v + close;
    }
  );

  out = out.replace(
    /(data-i18n-placeholder="([A-Za-z0-9_]+)")([^>]*?)(\splaceholder=")([^"]*)(")/g,
    (full, attr, key, mid, lead, _cur, q) => {
      const v = dict[key];
      if (v === undefined) {
        warn('missing placeholder key "' + key + '"');
        return full;
      }
      return attr + mid + lead + escAttr(v) + q;
    }
  );

  return out;
}

/** Pull the I18N object literal out of the page and evaluate it. */
function extractI18N(html) {
  const m = html.match(/var I18N = (\{[\s\S]*?\n  \});/);
  if (!m) throw new Error("could not locate the I18N dictionary in index.html");
  return new Function("return (" + m[1] + ");")();
}

/* ============================================================
   Step 1 — read source, normalise the domain
   ============================================================ */
if (!fs.existsSync(SRC_FILE)) {
  console.error("ERROR: index.html not found at " + SRC_FILE);
  process.exit(1);
}

let html = fs.readFileSync(SRC_FILE, "utf8");

const markerMatch = html.match(MARKER_RE);
const previousDomain = markerMatch ? markerMatch[1] : FALLBACK_DOMAIN;

/* Shield the illustrative placeholder URL, swap the domain, then restore it. */
html = html.split(EXAMPLE_IMAGE_URL).join(SENTINEL);
if (previousDomain !== SITE_URL) {
  html = html.split(previousDomain).join(SITE_URL);
}
html = html.split(SENTINEL).join(EXAMPLE_IMAGE_URL);

if (markerMatch) {
  html = html.replace(MARKER_RE, "<!-- SITE_URL: " + SITE_URL + " -->");
} else {
  warn("no SITE_URL marker found in index.html — URLs were not rewritten");
}

/* ============================================================
   Step 2 — write the Chinese page back (domain may have changed)
   ============================================================ */
fs.writeFileSync(SRC_FILE, html, "utf8");

/* ============================================================
   Step 3 — derive the English page
   ============================================================ */
const I18N = extractI18N(html);
if (!I18N.en) throw new Error("I18N.en dictionary is missing");

/* Key parity: every key used by the page must exist in both dictionaries. */
const zhKeys = new Set(Object.keys(I18N.zh));
const enKeys = new Set(Object.keys(I18N.en));
[...zhKeys].filter((k) => !enKeys.has(k)).forEach((k) => warn("en dict is missing key: " + k));
[...enKeys].filter((k) => !zhKeys.has(k)).forEach((k) => warn("zh dict is missing key: " + k));

/* Only the markup above the executable <script> carries static i18n nodes —
   everything below it is runtime logic and must stay untouched. */
const scriptStart = html.indexOf("<script>");
const headMarkup = scriptStart === -1 ? html : html.slice(0, scriptStart);
const tail = scriptStart === -1 ? "" : html.slice(scriptStart);

let en = localizeMarkup(headMarkup, I18N.en) + tail;

/* Language declaration — this is what the runtime reads to pick a dictionary. */
en = en.replace(
  /<html lang="[^"]*" data-lang="[^"]*">/,
  '<html lang="en" data-lang="en">'
);

/* Head metadata. */
en = setTitle(en, I18N.en.pageTitle);
en = setMeta(en, "description", EN_META.description);
en = setMeta(en, "og:title", I18N.en.pageTitle);
en = setMeta(en, "og:description", EN_META.description);
en = setMeta(en, "og:image:alt", EN_META.ogImageAlt);
en = setMeta(en, "og:locale", "en_US");
en = setMeta(en, "og:locale:alternate", "zh_CN");
en = setMeta(en, "twitter:title", I18N.en.pageTitle);
en = setMeta(en, "twitter:description", EN_META.description);
en = setCanonical(en, SITE_URL + "/en/");
en = setMeta(en, "og:url", SITE_URL + "/en/");
en = setJsonLd(en, EN_META.jsonLd);

/* Mark the English switcher entry as the current page. */
en = en.replace(/\s+aria-current="true"/g, "");
en = en.replace(
  /(<a class="lang__btn" data-lang="en"[^>]*?)>/,
  (m, attrs) => attrs + ' aria-current="true">'
);

/* ============================================================
   Step 4 — sitemap + robots
   ============================================================ */
const altLinks = [
  '    <xhtml:link rel="alternate" hreflang="zh-CN" href="' + SITE_URL + '/"/>',
  '    <xhtml:link rel="alternate" hreflang="en" href="' + SITE_URL + '/en/"/>',
  '    <xhtml:link rel="alternate" hreflang="x-default" href="' + SITE_URL + '/"/>',
].join("\n");

const sitemapEntry = (loc, priority) =>
  [
    "  <url>",
    "    <loc>" + loc + "</loc>",
    "    <lastmod>" + TODAY + "</lastmod>",
    altLinks,
    "    <changefreq>monthly</changefreq>",
    "    <priority>" + priority + "</priority>",
    "  </url>",
  ].join("\n");

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  sitemapEntry(SITE_URL + "/", "1.0") +
  "\n" +
  sitemapEntry(SITE_URL + "/en/", "0.9") +
  "\n</urlset>\n";

const robots =
  [
    "# Base64 Studio — static, fully client-side tool.",
    "# Two language versions, one canonical URL each.",
    "",
    "User-agent: *",
    "Allow: /",
    "",
    "# Reserved: if a '?url=' prefill feature is ever added, those URLs become",
    "# near-duplicate permutations of this page. Keep them out of the index.",
    "Disallow: /*?url=",
    "",
    "Sitemap: " + SITE_URL + "/sitemap.xml",
    "",
  ].join("\n");

/* ============================================================
   Step 5 — write outputs
   ============================================================ */
fs.mkdirSync(EN_DIR, { recursive: true });
fs.writeFileSync(EN_FILE, en, "utf8");
fs.writeFileSync(SITEMAP_FILE, sitemap, "utf8");
fs.writeFileSync(ROBOTS_FILE, robots, "utf8");

/* ============================================================
   Step 6 — self-check
   ============================================================ */
const checks = [];
const check = (cond, label, extra) =>
  checks.push({ ok: !!cond, label, extra });

const unesc = (s) =>
  String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

const zhTitle = html.match(/<title[^>]*>([^<]*)<\/title>/)[1];
const zhDictTitle = I18N.zh.pageTitle;
check(unesc(zhTitle) === zhDictTitle, "zh static <title> matches zh dictionary");

const enTitle = en.match(/<title[^>]*>([^<]*)<\/title>/)[1];
check(
  unesc(enTitle) === I18N.en.pageTitle,
  "en static <title> matches en dictionary",
  enTitle
);

const enCanon = (en.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
check(enCanon === SITE_URL + "/en/", "en canonical points at /en/", enCanon);
const enOgUrl = (en.match(/<meta property="og:url" content="([^"]*)"/) || [])[1];
check(enOgUrl === enCanon, "en og:url matches canonical");

const zhCanon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
check(zhCanon === SITE_URL + "/", "zh canonical points at /", zhCanon);

/* Every data-i18n node in the English page must now hold its English string. */
const stillZh = [];
let n; const re = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\sdata-i18n="([A-Za-z0-9_]+)"[^>]*>([\s\S]*?)<\/\1>/g;
while ((n = re.exec(en))) {
  if (I18N.en[n[2]] !== undefined && unesc(n[3]) !== I18N.en[n[2]]) stillZh.push(n[2]);
}
check(stillZh.length === 0, "every data-i18n node in /en/ carries its English string", stillZh.join(",") || "none");

check(!/<html lang="zh/.test(en) && /<html lang="en" data-lang="en">/.test(en), "en page declares lang=en");
/* Count only real elements — the CSS selector [aria-current="true"] and the
   runtime setAttribute call are not page state. */
check(
  (en.match(/<a[^>]*aria-current="true"/g) || []).length === 1,
  "exactly one element carries aria-current in /en/",
  "found " + (en.match(/<a[^>]*aria-current="true"/g) || []).length
);
check(!en.includes("var saved = null"), "en page has no legacy localStorage boot path");

try {
  const ld = JSON.parse(en.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  check(ld.inLanguage === "en" && ld.url === SITE_URL + "/en/", "en JSON-LD localised", ld.inLanguage + " " + ld.url);
} catch (e) {
  check(false, "en JSON-LD parses", e.message);
}

try {
  const sm = fs.readFileSync(SITEMAP_FILE, "utf8");
  check(/<urlset /.test(sm), "sitemap.xml well-formed root");
  check((sm.match(/<url>/g) || []).length === 2, "sitemap lists exactly 2 URLs");
  check((sm.match(/hreflang="en"/g) || []).length === 2, "sitemap carries hreflang alternates");
} catch (e) {
  check(false, "sitemap readable", e.message);
}

/* ============================================================
   Report
   ============================================================ */
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");
console.log("Base64 Studio — build\n");
console.log("  site url   " + SITE_URL + (IS_PLACEHOLDER ? "   <-- PLACEHOLDER" : ""));
console.log("  zh page    " + rel(SRC_FILE) + "  (" + Buffer.byteLength(html) + " bytes)");
console.log("  en page    " + rel(EN_FILE) + "  (" + Buffer.byteLength(en) + " bytes)");
console.log("  sitemap    " + rel(SITEMAP_FILE));
console.log("  robots     " + rel(ROBOTS_FILE));
console.log("");

if (warnings.length) {
  console.log("WARNINGS (" + warnings.length + ")");
  [...new Set(warnings)].forEach((w) => console.log("  ! " + w));
  console.log("");
}

const failed = checks.filter((c) => !c.ok);
console.log("SELF-CHECK: " + (checks.length - failed.length) + "/" + checks.length + " passed");
failed.forEach((c) => console.log("  FAIL " + c.label + (c.extra ? "  -> " + c.extra : "")));
console.log("");

if (IS_PLACEHOLDER) {
  console.log("!! SITE_URL is still the placeholder. Search engines would be told the");
  console.log("!! canonical version of this site lives on example.com. Run:");
  console.log("!!   node build.js https://your-real-domain.com");
  console.log("");
}

process.exit(failed.length === 0 ? 0 : 1);
