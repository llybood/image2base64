#!/usr/bin/env node
/**
 * SEO verification for the built site.
 *
 * Runs against the static export in ./out, not against the source. The
 * point of a separate verifier is that the deliverable should not be
 * certified by the code that produced it.
 *
 *   node scripts/verify-seo.mjs
 *   node scripts/verify-seo.mjs https://your-domain.com   # also asserts the domain
 *
 * Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
const realDomain = process.argv[2] || null;

let pass = 0;
const failures = [];

function ok(cond, label, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ""}`);
  }
}

/* ---------- target queries, mirrored from src/lib/site.ts ---------- */

const TARGETS = {
  zh: [
    { query: "图片转 base64", probe: "图片转 base64" },
    { query: "图片转 base64 在线", probe: "图片转 base64 在线" },
    { query: "图片 url 转 base64", probe: "图片 url 转 base64" },
    { query: "base64 编码", probe: "base64 编码" },
    { query: "图片 base64 转换", probe: "图片 base64 转换" },
  ],
  en: [
    { query: "convert image url to base64", probe: "convert image url to base64" },
    { query: "convert image to base64", probe: "convert image to base64" },
    { query: "image to base64 online", probe: "image to base64 online" },
    { query: "base64 encode", probe: "base64 encode" },
    { query: "image to base64 converter", probe: "image to base64 converter" },
  ],
};

/*
 * SERP budgets, measured in display width rather than character count.
 * A CJK glyph occupies about twice the width of a Latin one, so counting
 * characters would either wave through a bloated Chinese description or
 * reject a perfectly fine English one.
 */
const LIMITS = { title: 66, description: 200 };

const CJK = /[\u2E80-\u9FFF\uFF00-\uFF60\u3000-\u303F]/;
const width = (s) => [...s].reduce((n, c) => n + (CJK.test(c) ? 2 : 1), 0);

/* ---------- helpers ---------- */

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;|&#x2019;/g, "\u2019")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&mdash;/g, "\u2014");

const attr = (html, re) => {
  const m = re.exec(html);
  return m ? decode(m[1]) : null;
};

/** Visible text: scripts, styles and tags removed. */
function visibleText(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
  ).toLowerCase();
}

const headings = (html, level) =>
  [...html.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, "gi"))]
    .map((m) => decode(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
    .filter(Boolean);

const langs = (html) =>
  [...html.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]*>/gi)].map((m) => m[1]);

/**
 * Absolute URLs the page advertises in machine-readable metadata.
 *
 * Deliberately excludes body prose. The guide legitimately shows
 * "example.com/pic.png" as a documentation sample, and the URL field
 * uses it as a placeholder — neither says anything about where the site
 * claims to live. Only canonical / alternate / og / twitter / JSON-LD
 * speak for the deployment, so only those are inspected.
 */
function metadataUrls(html) {
  const urls = [];
  for (const m of html.matchAll(/<link[^>]+href="([^"]+)"/gi)) urls.push(m[1]);
  for (const m of html.matchAll(/<meta[^>]+>/gi)) {
    const c = /content="([^"]*)"/i.exec(m[0]);
    if (c && /^https?:\/\//.test(c[1])) urls.push(c[1]);
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    urls.push(m[1]);
  }
  return urls;
}

/* ---------- per-page checks ---------- */

function checkPage(lang, file) {
  console.log(`\n=== ${lang.toUpperCase()}  ${file} ===`);

  if (!existsSync(file)) {
    ok(false, `${file} exists`);
    return;
  }
  const html = readFileSync(file, "utf8");
  const text = visibleText(html);
  const h1s = headings(html, 1);
  const h2s = headings(html, 2);
  const headingText = [...h1s, ...h2s].join(" \u0000 ").toLowerCase();

  /* --- target query coverage --- */
  for (const t of TARGETS[lang]) {
    const inBody = text.includes(t.probe);
    const inHeading = headingText.includes(t.probe);
    ok(inBody, `query in body text: "${t.query}"`);
    ok(inHeading, `query in an H1/H2: "${t.query}"`);
  }

  /* --- title / description --- */
  const title = attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/i);
  ok(!!title, "has <title>");
  ok(!!desc, "has meta description");
  if (title) {
    ok(
      width(title) <= LIMITS.title,
      `title width ${width(title)} <= ${LIMITS.title} for "${title}"`,
      `raw length ${title.length}`
    );
  }
  if (desc) {
    ok(
      width(desc) <= LIMITS.description,
      `description width ${width(desc)} <= ${LIMITS.description}`,
      `raw length ${desc.length}`
    );
  }

  /* --- canonical + hreflang --- */
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/i);
  const expectedPath = lang === "zh" ? "/" : "/en/";
  ok(!!canonical, "has canonical");
  if (canonical) {
    ok(
      canonical.endsWith(expectedPath),
      `canonical ends with ${expectedPath}`,
      `got ${canonical}`
    );
  }
  const hs = langs(html);
  for (const want of ["zh-CN", "en", "x-default"]) {
    ok(hs.includes(want), `hreflang="${want}" present`);
  }

  /* --- html lang --- */
  // Anchor on whitespace so `data-lang="zh"` cannot be mistaken for `lang`.
  const htmlLang = attr(html, /<html[^>]*\slang="([^"]+)"/i);
  ok(
    htmlLang === (lang === "zh" ? "zh-CN" : "en"),
    `<html lang> is ${lang === "zh" ? "zh-CN" : "en"}`,
    `got ${htmlLang}`
  );

  /* --- one H1, and it carries the head term --- */
  ok(h1s.length === 1, `exactly one <h1> (found ${h1s.length})`);
  ok(h2s.length >= 5, `at least 5 <h2> sections (found ${h2s.length})`);

  /* --- social cards --- */
  for (const prop of ["og:title", "og:description", "og:url", "og:image", "og:type"]) {
    ok(html.includes(`property="${prop}"`) || html.includes(`name="${prop}"`), `${prop} present`);
  }
  ok(
    html.includes('name="twitter:card"') || html.includes('property="twitter:card"'),
    "twitter:card present"
  );
  ok(/og-cover\.png/.test(html), "og:image points at the share card");

  /* --- robots --- */
  ok(/name="robots"[^>]*content="[^"]*index/.test(html), "page is indexable");

  /* --- structured data --- */
  const jsonLdBlocks = [
    ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi),
  ].map((m) => m[1]);
  ok(jsonLdBlocks.length >= 1, "has JSON-LD block");
  let graph = null;
  if (jsonLdBlocks.length) {
    try {
      const parsed = JSON.parse(jsonLdBlocks[0]);
      graph = parsed["@graph"] || [parsed];
      ok(true, "JSON-LD parses");
    } catch (e) {
      ok(false, "JSON-LD parses", e.message);
    }
  }
  if (graph) {
    const types = graph.map((n) => n["@type"]);
    ok(types.includes("WebApplication"), "JSON-LD has WebApplication");
    ok(types.includes("FAQPage"), "JSON-LD has FAQPage");
    const faq = graph.find((n) => n["@type"] === "FAQPage");
    const n = faq?.mainEntity?.length ?? 0;
    ok(n >= 5, `FAQPage has >= 5 questions (found ${n})`);
    const app = graph.find((n) => n["@type"] === "WebApplication");
    ok(app?.offers?.price === "0", "WebApplication declares a free offer");
    ok(
      !JSON.stringify(graph).includes("aggregateRating"),
      "no fabricated aggregateRating"
    );
  }

  /* --- cross-language link, reachable without JS --- */
  const otherHref = lang === "zh" ? 'href="/en/"' : 'href="/"';
  ok(html.includes(otherHref), `links to the other language version (${otherHref})`);
  ok(/aria-current="true"/.test(html), "current language marked with aria-current");

  /* --- the domain the page claims to live at --- */
  if (realDomain) {
    const urls = metadataUrls(html);
    const stale = urls.filter((u) => u.includes("example.com"));
    ok(
      stale.length === 0,
      "no placeholder domain left in canonical / og / hreflang / JSON-LD",
      stale.length ? `found in: ${stale.join(" | ").slice(0, 220)}` : undefined
    );
    ok(
      urls.some((u) => u.startsWith(realDomain)),
      `metadata advertises the real domain (${realDomain})`
    );
  }
}

/* ---------- site-level checks ---------- */

function checkSiteFiles() {
  console.log(`\n=== SITE FILES ===`);
  const robots = join(OUT, "robots.txt");
  const sitemap = join(OUT, "sitemap.xml");
  ok(existsSync(robots), "out/robots.txt generated");
  ok(existsSync(sitemap), "out/sitemap.xml generated");
  ok(existsSync(join(OUT, "favicon.svg")), "favicon.svg shipped");
  ok(existsSync(join(OUT, "og-cover.png")), "og-cover.png shipped");
  ok(existsSync(join(OUT, "apple-touch-icon.png")), "apple-touch-icon.png shipped");

  if (existsSync(sitemap)) {
    const xml = readFileSync(sitemap, "utf8");
    ok(xml.includes("hreflang=\"zh-CN\""), "sitemap carries hreflang annotations");
    ok(xml.includes("hreflang=\"en\""), "sitemap carries the en hreflang");
    ok(xml.includes("/en/"), "sitemap lists /en/");
  }
  if (existsSync(robots)) {
    const txt = readFileSync(robots, "utf8");
    ok(/Sitemap:/i.test(txt), "robots.txt points at the sitemap");
  }
}

/* ---------- run ---------- */

console.log("Base64 Studio — SEO verification");
if (realDomain) console.log(`domain under test: ${realDomain}`);
else console.log("(pass a domain as argv[2] to also assert the placeholder is gone)");

checkPage("zh", join(OUT, "index.html"));
checkPage("en", join(OUT, "en", "index.html"));
checkSiteFiles();

console.log(`\n${"-".repeat(52)}`);
if (failures.length) {
  console.log(`${pass} passed, ${failures.length} FAILED:`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`All ${pass} checks passed.`);
