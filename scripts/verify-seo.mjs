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

/* ---------- target queries, mirrored from src/lib/site.ts ----------
 *
 * Keyed by (page, language), because the two tools target two different
 * query clusters. Sharing one list between them is precisely the mistake
 * the separate pages exist to avoid: the encoder's terms would then
 * certify the decoder without ever appearing on it.
 */

const TARGETS = {
  encode: {
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
    de: [
      { query: "bild zu base64", probe: "bild zu base64" },
      { query: "bild in base64 umwandeln", probe: "bild in base64 umwandeln" },
      // German compounds the noun, so the page writes "Bild-URL" while the
      // query is typed with a space. The probe is the literal on the page.
      { query: "bild url zu base64", probe: "bild-url zu base64" },
      { query: "base64 kodieren", probe: "base64 kodieren" },
      { query: "base64 konverter", probe: "base64 konverter" },
    ],
  },
  decode: {
    zh: [
      { query: "base64 转图片", probe: "base64 转图片" },
      { query: "base64 转图片 在线", probe: "base64 转图片 在线" },
      { query: "base64 解码", probe: "base64 解码" },
      { query: "base64 转 png", probe: "base64 转 png" },
      { query: "base64 转图片 工具", probe: "base64 转图片 工具" },
    ],
    en: [
      { query: "convert base64 to image", probe: "convert base64 to image" },
      { query: "base64 to image converter", probe: "base64 to image converter" },
      { query: "base64 to image online", probe: "base64 to image online" },
      { query: "decode base64 to image", probe: "decode base64 to image" },
      { query: "base64 to png", probe: "base64 to png" },
    ],
    de: [
      { query: "base64 zu bild", probe: "base64 zu bild" },
      { query: "base64 in bild umwandeln", probe: "base64 in bild umwandeln" },
      // Same compound problem as the forward page: German writes
      // "Base64-Bild-Konverter" as one hyphenated word while the query is
      // typed with spaces. `probe` is the literal on the page.
      { query: "base64 bild konverter", probe: "base64-bild-konverter" },
      { query: "base64 dekodieren", probe: "base64 dekodieren" },
      { query: "base64 zu png", probe: "base64 zu png" },
    ],
  },
};

/*
 * SERP budgets, measured in display width rather than character count.
 * A CJK glyph occupies about twice the width of a Latin one, so counting
 * characters would either wave through a bloated Chinese description or
 * reject a perfectly fine English one.
 */
const LIMITS = { title: 66, description: 200 };

/* ---------- routing, mirrored from src/lib/site.ts ----------
 *
 * Deliberately duplicated rather than imported: the verifier must not be
 * able to drift along with the code it is checking. English is the default
 * language, so it owns the site root and is what x-default must advertise.
 *
 * A URL is a (language, page) pair, not a language. The site ships two
 * tools, so "the German version" is ambiguous on its own — and a
 * language-only table cannot express it, which is exactly why the
 * assertions below are written per page rather than per language.
 *
 * If a language or a page is ever added, this block is the whole
 * contract: the checks at the bottom iterate PAGES × LANGS, so nothing
 * can end up routed but unchecked.
 *
 * The set must match src/lib/site.ts; the order need not, because every
 * assertion below is membership- or look-up based. It is kept in the same
 * order anyway so the two lists can be diffed at a glance.
 */
const LANGS = ["en", "de", "zh"];
const PAGES = ["encode", "decode"];
const HTML_LANG = { en: "en", zh: "zh-CN", de: "de" };
const DEFAULT_LANG = "en";

/** The page's path under each language's root. `encode` owns the root
    itself; `decode` sits one segment below it. */
const LANG_ROOT = { en: "/", zh: "/zh/", de: "/de/" };
const DECODE_SLUG = "base64-to-image/";

/**
 * The one place a URL is composed here, mirroring `pagePath` in
 * src/lib/site.ts. Every assertion below compares against this rather
 * than against a hard-coded string, so a page cannot be routed at one
 * path and checked at another.
 */
function pagePath(lang, page) {
  return page === "encode" ? LANG_ROOT[lang] : LANG_ROOT[lang] + DECODE_SLUG;
}

/** Every (page, language) URL the site ships, in a stable order. */
const ALL_PATHS = PAGES.flatMap((page) => LANGS.map((lang) => pagePath(lang, page)));

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
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    // German typographic quotes, which sit the opposite way round from
    // the English pair: opening is low-9, closing is high-6.
    .replace(/&bdquo;/g, "\u201E")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D");

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

/**
 * hreflang → absolute URL, read from the page head's alternate links.
 * Attribute matching is case-insensitive because the HTML uses `hrefLang`
 * while the sitemap uses `hreflang`.
 */
function alternates(html) {
  const map = {};
  for (const m of html.matchAll(/<link[^>]+rel="alternate"[^>]*>/gi)) {
    const hl = /hreflang="([^"]+)"/i.exec(m[0]);
    const href = /href="([^"]+)"/i.exec(m[0]);
    if (hl && href) map[hl[1]] = decode(href[1]);
  }
  return map;
}

/**
 * Pathname of an absolute URL, normalised to a trailing slash.
 *
 * Comparing bare paths rather than full URLs is what makes the x-default
 * assertion meaningful: "/" and "/zh/" both end in a slash, so a naive
 * `endsWith("/")` would pass for either one and prove nothing.
 */
function pathOf(url) {
  try {
    const p = new URL(url).pathname;
    return p.endsWith("/") ? p : `${p}/`;
  } catch {
    return null;
  }
}

/**
 * Order-insensitive comparison of two {code: value} maps.
 *
 * Used for alternates blocks, where the keys are a set and the insertion
 * order is an implementation detail. Comparing serialised objects would
 * make a harmless reordering look like a failure.
 */
function sameMap(a, b) {
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  if (ka.length !== kb.length) return false;
  if (!ka.every((k, i) => k === kb[i])) return false;
  return ka.every((k) => a[k] === b[k]);
}

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

function checkPage(lang, page, file) {
  console.log(`\n=== ${lang.toUpperCase()} / ${page}  ${file} ===`);

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
  for (const t of TARGETS[page][lang]) {
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
  const expectedPath = pagePath(lang, page);
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/i);
  ok(!!canonical, "has canonical");
  if (canonical) {
    ok(
      pathOf(canonical) === expectedPath,
      `canonical is this page's own path (${expectedPath})`,
      `got ${canonical}`
    );
  }
  const alt = alternates(html);
  // Every shipped language, plus x-default, must be declared — on every
  // page. A language that is routed but not advertised is unreachable to
  // a crawler, which is the whole failure mode hreflang exists to avoid.
  for (const want of [...LANGS.map((l) => HTML_LANG[l]), "x-default"]) {
    ok(want in alt, `hreflang="${want}" present`);
  }
  // Each annotation must point at *this page* in its language, not at the
  // language root and not at the sibling tool. This is the assertion the
  // second page was added to break, so it is spelled out per language
  // rather than only checked as a set.
  for (const l of LANGS) {
    const code = HTML_LANG[l];
    if (code in alt) {
      ok(
        pathOf(alt[code]) === pagePath(l, page),
        `hreflang="${code}" points at this page's ${l} counterpart (${pagePath(l, page)})`,
        `got ${alt[code]}`
      );
    }
  }
  // The point of the x-default annotation is to name the default
  // language's copy of *this* page, so this asserts where it points, not
  // merely that it exists. All three languages must agree on it.
  if ("x-default" in alt) {
    ok(
      pathOf(alt["x-default"]) === pagePath(DEFAULT_LANG, page),
      `x-default points at this page in the default language (${pagePath(DEFAULT_LANG, page)})`,
      `got ${alt["x-default"]}`
    );
  }
  // The reverse page's annotations must never resolve to a language root:
  // that would tell a crawler the German decoder is the English encoder.
  // The check above already rules it out, but it would keep passing if the
  // two pages ever collapsed onto one path — and this is the specific
  // regression worth naming.
  if (page === "decode") {
    for (const l of LANGS) {
      const code = HTML_LANG[l];
      if (code in alt) {
        ok(
          pathOf(alt[code]) !== LANG_ROOT[l],
          `hreflang="${code}" on the reverse page does not point at the encoder (${LANG_ROOT[l]})`,
          `got ${alt[code]}`
        );
      }
    }
  }

  /* --- html lang --- */
  // Anchor on whitespace so `data-lang="de"` cannot be mistaken for `lang`.
  const htmlLang = attr(html, /<html[^>]*\slang="([^"]+)"/i);
  ok(
    htmlLang === HTML_LANG[lang],
    `<html lang> is ${HTML_LANG[lang]}`,
    `got ${htmlLang}`
  );

  /* --- Open Graph locale pair --- */
  const ogLocale = attr(html, /<meta property="og:locale" content="([^"]*)"/i);
  ok(/^[a-z]{2}_[A-Z]{2}$/.test(ogLocale || ""), `og:locale is well-formed`, `got ${ogLocale}`);

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
    // Every structured-data URL on this site's own origin must describe
    // this page, not its sibling. External references — @context and
    // anything else on another host — are out of scope by construction,
    // which is why the comparison is origin-scoped rather than a plain
    // scan for site-shaped paths: "https://schema.org" resolves to "/".
    const ownOrigin = canonical ? new URL(canonical).origin : null;
    const wanted = new Set([
      ...LANGS.map((l) => pagePath(l, page)),
      pagePath(DEFAULT_LANG, page),
    ]);
    const offending = [];
    if (ownOrigin) {
      for (const m of JSON.stringify(graph).matchAll(/https?:\/\/[^"\s,)\\]+/g)) {
        let u;
        try {
          u = new URL(m[0]);
        } catch {
          continue;
        }
        if (u.origin !== ownOrigin) continue;
        const p = pathOf(m[0]);
        if (p && ALL_PATHS.includes(p) && !wanted.has(p)) offending.push(p);
      }
    }
    ok(
      offending.length === 0,
      "JSON-LD names no other page of this site",
      offending.length ? `found: ${[...new Set(offending)].join(", ")}` : undefined
    );
  }

  /* --- cross-language links, reachable without JS --- */
  // Every other language *of this page* — not just one, and not the
  // language root. With three languages a page that links to only its
  // siblings' roots still looks fine to a naive check while sending the
  // visitor into the other tool.
  for (const l of LANGS.filter((x) => x !== lang)) {
    const href = `href="${pagePath(l, page)}"`;
    ok(html.includes(href), `links to the ${l} copy of this page (${href})`);
  }
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
    // Every language must be annotated in the sitemap too, not just
    // listed — hreflang lives in two independent places by design.
    for (const l of LANGS) {
      ok(
        xml.includes(`hreflang="${HTML_LANG[l]}"`),
        `sitemap carries the ${HTML_LANG[l]} hreflang`
      );
    }

    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => pathOf(m[1]));
    // One URL per (page, language) pair — six while the site ships two
    // tools in three languages. Asserting the count against the routing
    // table rather than a literal means adding a page cannot leave the
    // sitemap silently short.
    ok(
      locs.length === ALL_PATHS.length,
      `sitemap lists exactly ${ALL_PATHS.length} URLs, one per page × language (found ${locs.length})`
    );
    for (const p of ALL_PATHS) {
      ok(locs.includes(p), `sitemap lists ${p}`);
    }
    // No duplicate <loc>: two entries for one URL is a sitemap error, and
    // an easy one to introduce when the list is generated.
    ok(new Set(locs).size === locs.length, "sitemap lists no URL twice");

    /*
     * Per-entry alternates.
     *
     * This is the assertion the second page exists to make meaningful. A
     * sitemap that lists six URLs but gives every one of them the same
     * alternates block is worse than one that omits alternates entirely:
     * it actively tells a crawler that the decoder and the encoder are
     * translations of each other. So each block is checked against its own
     * page, read back out of its own <loc> rather than assumed.
     */
    const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
    ok(
      blocks.length === ALL_PATHS.length,
      `sitemap has one <url> block per page × language (found ${blocks.length})`
    );

    let decodeBlocks = 0;
    for (const b of blocks) {
      const loc = pathOf(/<loc>([^<]+)<\/loc>/.exec(b)?.[1] ?? "");
      const page = loc && loc.includes(DECODE_SLUG) ? "decode" : "encode";
      const lang = LANGS.find((l) => pagePath(l, page) === loc);
      if (lang) {
        if (page === "decode") decodeBlocks++;
        const want = {};
        for (const l of LANGS) want[HTML_LANG[l]] = pagePath(l, page);
        want["x-default"] = pagePath(DEFAULT_LANG, page);

        const got = {};
        for (const m of b.matchAll(/hreflang="([^"]+)"\s+href="([^"]+)"/g)) {
          got[m[1]] = pathOf(m[2]);
        }
        ok(
          sameMap(got, want),
          `sitemap block ${loc} pairs with its own page in every language`,
          `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`
        );
      }
    }
    ok(
      decodeBlocks === LANGS.length,
      `every reverse page has its own sitemap block (found ${decodeBlocks})`
    );

    const xd = /hreflang="x-default"\s+href="([^"]+)"/i.exec(xml);
    ok(!!xd, "sitemap carries an x-default annotation");
    if (xd) {
      ok(
        pathOf(xd[1]) === pagePath(DEFAULT_LANG, "encode"),
        `sitemap x-default points at the default language (${pagePath(DEFAULT_LANG, "encode")})`,
        `got ${xd[1]}`
      );
    }
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

/** out/index.html for "/", out/zh/base64-to-image/index.html, and so on. */
const pageFile = (lang, page) =>
  join(OUT, ...pagePath(lang, page).split("/").filter(Boolean), "index.html");

// Driven by PAGES × LANGS, so nothing can end up routed but unchecked.
// The outer loop is over pages so that one page's languages are reported
// together — easier to diff against the source when something breaks.
let checked = 0;
for (const page of PAGES) {
  for (const lang of LANGS) {
    checkPage(lang, page, pageFile(lang, page));
    checked++;
  }
}
ok(
  checked === PAGES.length * LANGS.length,
  `every page × language combination was checked (${checked})`
);
checkSiteFiles();

console.log(`\n${"-".repeat(52)}`);
if (failures.length) {
  console.log(`${pass} passed, ${failures.length} FAILED:`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`All ${pass} checks passed.`);
