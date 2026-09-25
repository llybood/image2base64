/* Temporary verification harness for the SEO refactor. Not a deliverable. */
const fs = require("fs");
const path = require("path");

const root = process.argv[2] || ".";
const file = path.join(root, process.argv[3] || "index.html");
const html = fs.readFileSync(file, "utf8");

let fails = 0;
const ok = (cond, label, extra) => {
  if (!cond) fails++;
  console.log((cond ? "OK   " : "FAIL ") + label + (extra !== undefined ? "  -> " + extra : ""));
};

console.log("=== " + file + " (" + html.length + " bytes) ===\n");

/* 1. main script syntax */
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { ok(false, "main <script> present"); }
else {
  try { new Function(m[1]); ok(true, "main script syntax"); }
  catch (e) { ok(false, "main script syntax", e.message); }
}

/* 2. JSON-LD */
const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!ld) { ok(false, "JSON-LD present"); }
else {
  try {
    const o = JSON.parse(ld[1]);
    ok(true, "JSON-LD parses", "@type=" + o["@type"] + " inLanguage=" + o.inLanguage);
    ok(!("aggregateRating" in o), "JSON-LD omits aggregateRating");
  } catch (e) { ok(false, "JSON-LD parses", e.message); }
}

/* 3. tag balance */
["html", "head", "body", "main", "header", "footer", "nav", "noscript", "ul", "aside"]
  .forEach(t => {
    const o = (html.match(new RegExp("<" + t + "[ >]", "g")) || []).length;
    const c = (html.match(new RegExp("</" + t + ">", "g")) || []).length;
    ok(o === c, "<" + t + "> balanced", "open=" + o + " close=" + c);
  });

/* 4. residues that should be gone */
["aria-pressed", "b64studio.lang", 'navigator.language ||', 'href="#"'].forEach(s => {
  const n = html.split(s).length - 1;
  ok(n === 0, 'no residue: "' + s + '"', "count=" + n);
});

/* 5. static title vs the dictionary matching THIS page's language */
const pageLang = (html.match(/<html[^>]*\sdata-lang="([^"]*)"/) || [])[1] || "zh";
const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/);
const dictTitleM =
  pageLang === "en"
    ? html.match(/en:\s*\{[\s\S]*?pageTitle:\s*"([^"]*)"/)
    : html.match(/zh:\s*\{[\s\S]*?pageTitle:\s*"([^"]*)"/);
const unescHtml = (s) =>
  String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
if (titleTag && dictTitleM) {
  ok(
    unescHtml(titleTag[1]) === dictTitleM[1],
    "static <title> matches I18N." + pageLang + ".pageTitle"
  );
  if (unescHtml(titleTag[1]) !== dictTitleM[1]) {
    console.log("      static : " + titleTag[1]);
    console.log("      dict   : " + dictTitleM[1]);
  }
}

/* 6. i18n dictionary key parity */
const zhBlock = html.slice(html.indexOf("zh: {"), html.indexOf("en: {"));
const enBlock = html.slice(html.indexOf("en: {"), html.indexOf("var currentLang"));
const keys = blk => {
  const s = new Set();
  const re = /^\s*([A-Za-z][A-Za-z0-9_]*)\s*:/gm;
  let x; while ((x = re.exec(blk))) s.add(x[1]);
  s.delete("zh"); s.delete("en"); // the block's own opening label is not a key
  return s;
};
const zh = keys(zhBlock), en = keys(enBlock);
const missEn = [...zh].filter(k => !en.has(k));
const missZh = [...en].filter(k => !zh.has(k));
ok(missEn.length === 0, "zh keys all present in en", missEn.length ? missEn.join(",") : zh.size + "/" + en.size);
ok(missZh.length === 0, "en keys all present in zh", missZh.length ? missZh.join(",") : "none");

/* 7. every data-i18n key resolves in both dicts */
const used = new Set();
let u; const ure = /data-i18n(?:-placeholder|-title)?="([A-Za-z][A-Za-z0-9_]*)"/g;
while ((u = ure.exec(html))) used.add(u[1]);
const unresZ = [...used].filter(k => !zh.has(k));
const unresE = [...used].filter(k => !en.has(k));
ok(unresZ.length === 0, "all data-i18n keys exist in zh dict", unresZ.join(",") || used.size + " keys");
ok(unresE.length === 0, "all data-i18n keys exist in en dict", unresE.join(",") || "none");

/* 8. html lang / data-lang coherence */
const langAttr = (html.match(/<html[^>]*\slang="([^"]*)"/) || [])[1];
const dataLang = (html.match(/<html[^>]*\sdata-lang="([^"]*)"/) || [])[1];
ok(!!langAttr && !!dataLang, "<html> declares lang + data-lang", "lang=" + langAttr + " data-lang=" + dataLang);
ok(
  (dataLang === "en") === (langAttr === "en"),
  "lang and data-lang agree",
  langAttr + " / " + dataLang
);

/* 9. hreflang triad present and self-referential */
const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
const alts = {};
let a; const are = /<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g;
while ((a = are.exec(html))) alts[a[1]] = a[2];
ok(!!canonical, "canonical present", canonical);
["zh-CN", "en", "x-default"].forEach(h => ok(!!alts[h], "hreflang " + h, alts[h]));
if (dataLang === "en") ok(canonical === alts["en"], "en page canonical == hreflang en");
else ok(canonical === alts["zh-CN"], "zh page canonical == hreflang zh-CN");

/* 10. required OG / twitter tags */
["og:type", "og:title", "og:description", "og:url", "og:image", "og:locale"].forEach(p => {
  const re = new RegExp('<meta property="' + p + '" content="([^"]*)"');
  const v = (html.match(re) || [])[1];
  ok(!!v, "OG " + p, v ? v.slice(0, 58) + (v.length > 58 ? "..." : "") : "MISSING");
});
const ogUrl = (html.match(/<meta property="og:url" content="([^"]*)"/) || [])[1];
ok(ogUrl === canonical, "og:url == canonical");
["twitter:card", "twitter:title", "twitter:image"].forEach(p => {
  const v = (html.match(new RegExp('<meta name="' + p + '" content="([^"]*)"')) || [])[1];
  ok(!!v, "twitter " + p, v);
});

/* 11. domain injection (only when a real domain is supplied) */
if (process.argv[4]) {
  const real = process.argv[4];
  /* the illustrative pic.png URL is deliberately left pointing at example.com */
  const withoutExample = html.split("https://example.com/pic.png").join("");
  ok(
    !withoutExample.includes("example.com"),
    "domain rewritten everywhere except the illustrative pic.png"
  );
  ok(html.includes(real), "target domain present: " + real);
}

/* 12. language switcher is crawlable anchors */
const switcher = html.match(/<nav class="lang"[\s\S]*?<\/nav>/);
if (switcher) {
  ok(/href="\/"/.test(switcher[0]), "switcher links to /");
  ok(/href="\/en\/"/.test(switcher[0]), "switcher links to /en/");
  ok(/aria-current="true"/.test(switcher[0]), "switcher marks current language");
  ok((switcher[0].match(/aria-current="true"/g) || []).length === 1, "exactly one aria-current");
}

/* 13. crawlable text beyond the widget (rough content check) */
const bodyText = html
  .replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();
console.log("\n[indexable text chars (excl. style/script): " + bodyText.length + "]");

console.log("\n=== " + (fails === 0 ? "ALL CHECKS PASSED" : fails + " CHECK(S) FAILED") + " ===");
process.exit(fails === 0 ? 0 : 1);
