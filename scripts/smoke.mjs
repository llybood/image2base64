#!/usr/bin/env node
/**
 * End-to-end smoke test for the exported site.
 *
 * Serves ./out, drives a real headless Chrome over CDP, and asserts the
 * converter actually works — not just that the HTML contains the right
 * strings. The interesting checks are the byte-exact round trips: a file
 * goes in as bytes, the Base64 on the page is decoded, and the two are
 * compared byte for byte. A green SEO report says nothing about whether
 * the tool functions, so this is the counterpart to verify-seo.mjs.
 *
 *   node scripts/smoke.mjs
 *   CHROME_PATH=/path/to/chrome node scripts/smoke.mjs
 *
 * Exits non-zero on any failure. Skips (exit 0) when no browser is found,
 * so a machine without Chrome does not fail an unrelated build.
 */

import { createServer } from "node:http";
import {
  createReadStream,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, extname, resolve, sep } from "node:path";
import { spawn } from "node:child_process";

const OUT = resolve("out");
const start = Date.now();

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const since = () => `${((Date.now() - start) / 1000).toFixed(1)}s`;

/* ------------------------------------------------------------------ *
 * Static server for ./out — mirrors what a CDN in front of the export
 * would do, including the trailingSlash directory index.
 * ------------------------------------------------------------------ */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function serve(root) {
  return new Promise((done) => {
    const server = createServer((req, res) => {
      const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
      let file = join(root, pathname);
      // Chrome asks for /favicon.ico unless the document declares an icon;
      // answer it so the run is not polluted by a spurious 404.
      if (pathname === "/favicon.ico") file = join(root, "favicon.svg");
      if (pathname.endsWith("/")) file = join(file, "index.html");
      if (!resolve(file).startsWith(root + sep)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      let isFile = false;
      try {
        isFile = statSync(file).isFile();
      } catch {
        /* fall through to 404 */
      }
      if (!isFile) {
        res.writeHead(404, { "content-type": "text/plain" }).end("not found");
        return;
      }
      res.writeHead(200, {
        "content-type": MIME[extname(file)] || "application/octet-stream",
        "cache-control": "no-store",
      });
      createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => done(server));
  });
}

/* ------------------------------------------------------------------ *
 * Browser discovery
 * ------------------------------------------------------------------ */

function findBrowser() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((c) => c && existsSync(c)) || null;
}

/* ------------------------------------------------------------------ *
 * Minimal CDP client over Node's built-in WebSocket
 * ------------------------------------------------------------------ */

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.addEventListener("message", (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const fn of this.listeners) fn(msg);
      }
    });
  }

  static connect(url) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const fail = () => reject(new Error(`cannot connect to ${url}`));
      ws.addEventListener("open", () => resolve(new Cdp(ws)), { once: true });
      ws.addEventListener("error", fail, { once: true });
    });
  }

  send(method, params = {}) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(fn) {
    this.listeners.push(fn);
  }

  async eval(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error(
        `page threw: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`
      );
    }
    return r.result?.value;
  }

  /** Poll an expression until it returns truthy. */
  async waitFor(expression, { timeout = 8000, interval = 100 } = {}) {
    const deadline = Date.now() + timeout;
    for (;;) {
      let v;
      try {
        v = await this.eval(expression);
      } catch {
        v = false;
      }
      if (v) return v;
      if (Date.now() > deadline) return null;
      await sleep(interval);
    }
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  return res.json();
}

/* ------------------------------------------------------------------ *
 * Fixtures — real assets from public/, so the bytes are known-good.
 * ------------------------------------------------------------------ */

const FIXTURES = {
  png: { path: "public/apple-touch-icon.png", name: "apple-touch-icon.png", mime: "image/png" },
  svg: { path: "public/favicon.svg", name: "favicon.svg", mime: "image/svg+xml" },
};

function fixture(f) {
  const bytes = readFileSync(f.path);
  return {
    base64: bytes.toString("base64"),
    size: bytes.length,
    name: f.name,
    mime: f.mime,
  };
}

/* ------------------------------------------------------------------ *
 * Per-page test run
 * ------------------------------------------------------------------ */

async function testPage(cdp, origin, path, lang, consoleErrors) {
  console.log(`\n=== ${lang.toUpperCase()}  ${path} ===`);

  const url = origin + path;
  const navStart = Date.now();
  await cdp.send("Page.navigate", { url });

  const loaded = await cdp.waitFor("document.readyState === 'complete'");
  ok(!!loaded, `page reaches readyState=complete (${since()}, nav ${Date.now() - navStart}ms)`);

  /* --- hydration: tab clicks must flip aria-selected ---
     A pre-hydration document ignores them entirely. Re-query the tabs after
     each click: React may replace the nodes while patching, and a stale
     reference would silently swallow the second click. Ending on tab 0 also
     restores the default Data URI mode the assertions below assume. */
  const hydrated = await cdp.waitFor(
    `(async () => {
       if (document.querySelectorAll('.tab').length < 2) return false;
       document.querySelectorAll('.tab')[1].click();
       await new Promise((r) => setTimeout(r, 80));
       if (document.querySelectorAll('.tab')[1].getAttribute('aria-selected') !== 'true') return false;
       document.querySelectorAll('.tab')[0].click();
       await new Promise((r) => setTimeout(r, 80));
       return document.querySelectorAll('.tab')[0].getAttribute('aria-selected') === 'true';
     })()`,
    { timeout: 15000 }
  );
  ok(!!hydrated, "React hydrates (tab click flips aria-selected)");
  if (!hydrated) return;

  /* --- server-rendered shell is still correct after hydration --- */
  const shell = await cdp.eval(`(() => {
    const h1 = document.querySelectorAll('h1');
    return {
      lang: document.documentElement.getAttribute('lang'),
      headingCount: h1.length,
      h1: h1[0] ? h1[0].textContent.trim().slice(0, 80) : '',
      dropzone: !!document.querySelector('#dropzone'),
      urlInput: !!document.querySelector('#urlInput'),
      fileInput: !!document.querySelector('input[type=file]'),
      codeBox: !!document.querySelector('#codeText'),
    };
  })()`);
  const expectedLang = { en: "en", zh: "zh-CN", de: "de" }[lang];
  ok(shell.lang === expectedLang, `<html lang> stays ${expectedLang}`, `got ${shell.lang}`);
  ok(shell.headingCount === 1, "exactly one h1 after hydration", `found ${shell.headingCount}`);
  ok(shell.dropzone && shell.urlInput && shell.fileInput && shell.codeBox,
    "tool controls present (dropzone, url, file, output)");

  /* --- 1. local PNG: byte-exact round trip --- */
  const png = fixture(FIXTURES.png);
  await cdp.eval(`(() => {
    const bin = atob(${JSON.stringify(png.base64)});
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    window.__fixture = { bytes, size: bytes.length };
    const input = document.querySelector('input[type=file]');
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], ${JSON.stringify(png.name)}, { type: ${JSON.stringify(png.mime)} }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);

  const pngReady = await cdp.waitFor(
    `document.querySelector('#codeText').textContent.includes('data:image/png;base64,')`,
    { timeout: 10000 }
  );
  ok(!!pngReady, "local PNG produces a Data URI");

  const pngRoundTrip = await cdp.eval(`(() => {
    const text = document.querySelector('#codeText').textContent;
    const prefix = 'data:image/png;base64,';
    if (!text.startsWith(prefix)) {
      return { ok: false, why: 'not a PNG Data URI', head: text.slice(0, 40) };
    }
    const bin = atob(text.slice(prefix.length));
    const want = window.__fixture.bytes;
    if (bin.length !== want.length) return { ok: false, why: 'length', got: bin.length, want: want.length };
    for (let i = 0; i < want.length; i++) {
      if (bin.charCodeAt(i) !== want[i]) return { ok: false, why: 'byte ' + i };
    }
    return {
      ok: true,
      bytes: bin.length,
      dims: document.querySelector('.metastrip__name span')?.textContent.trim() || '',
      stats: [...document.querySelectorAll('.stat')].map((s) =>
        s.querySelector('.stat__k').textContent.trim() + '=' +
        s.querySelector('.stat__v').textContent.trim()
      ).join(', '),
    };
  })()`);
  ok(pngRoundTrip.ok,
    `Data URI decodes back to the original ${png.size} bytes`,
    pngRoundTrip.ok ? undefined : JSON.stringify(pngRoundTrip));
  ok(pngRoundTrip.ok && /180\s*×\s*180\s*px/.test(pngRoundTrip.dims),
    "the record reports the image's real pixel dimensions", pngRoundTrip.dims);
  ok(pngRoundTrip.ok && /PNG/.test(pngRoundTrip.stats),
    "the record reports original size, text size, growth and format", pngRoundTrip.stats);

  /* --- 2. raw Base64 tab: same bytes, no prefix --- */
  await cdp.eval(`document.querySelectorAll('.tab')[1].click()`);
  await sleep(150);
  const raw = await cdp.eval(`(() => {
    const text = document.querySelector('#codeText').textContent;
    if (text.startsWith('data:')) return { ok: false, why: 'still prefixed' };
    const bin = atob(text);
    const want = window.__fixture.bytes;
    if (bin.length !== want.length) return { ok: false, why: 'length', got: bin.length, want: want.length };
    for (let i = 0; i < want.length; i++) if (bin.charCodeAt(i) !== want[i]) return { ok: false, why: 'byte ' + i };
    return { ok: true, chars: text.length };
  })()`);
  ok(raw.ok, "raw Base64 tab round-trips the same bytes without the prefix",
    raw.ok ? undefined : JSON.stringify(raw));

  // Back to Data URI mode for the remaining checks.
  await cdp.eval(`document.querySelectorAll('.tab')[0].click()`);
  await sleep(120);

  /* --- 3. SVG goes through the text path --- */
  const svg = fixture(FIXTURES.svg);
  await cdp.eval(`(() => {
    const bin = atob(${JSON.stringify(svg.base64)});
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    window.__svg = { bytes };
    const input = document.querySelector('input[type=file]');
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], ${JSON.stringify(svg.name)}, { type: ${JSON.stringify(svg.mime)} }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  const svgReady = await cdp.waitFor(
    `document.querySelector('#codeText').textContent.includes('data:image/svg+xml;base64,')`,
    { timeout: 10000 }
  );
  ok(!!svgReady, "local SVG produces a data:image/svg+xml;base64 URI");
  const svgRoundTrip = await cdp.eval(`(() => {
    const text = document.querySelector('#codeText').textContent;
    const payload = text.slice(text.indexOf(',') + 1);
    const bytes = new TextEncoder().encode(new TextDecoder().decode(
      Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
    ));
    const want = window.__svg.bytes;
    if (bytes.length !== want.length) return { ok: false, why: 'length', got: bytes.length, want: want.length };
    for (let i = 0; i < want.length; i++) if (bytes[i] !== want[i]) return { ok: false, why: 'byte ' + i };
    return { ok: true };
  })()`);
  ok(svgRoundTrip.ok, "SVG payload survives the UTF-8 round trip",
    svgRoundTrip.ok ? undefined : JSON.stringify(svgRoundTrip));

  /* --- 4. remote URL, same origin, fetched through the app --- */
  await cdp.eval(`(() => {
    const input = document.querySelector('#urlInput');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(origin + "/apple-touch-icon.png")});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await sleep(120);
  await cdp.eval(`document.querySelector('#urlInput').parentElement.querySelector('button').click()`);

  const urlReady = await cdp.waitFor(
    `document.querySelector('.metastrip__name b') &&
     document.querySelector('.metastrip__name b').textContent.includes('apple-touch-icon')`,
    { timeout: 10000 }
  );
  ok(!!urlReady, "image URL loads and becomes the active record");
  const urlRec = await cdp.eval(`(() => {
    const text = document.querySelector('#codeText').textContent;
    return {
      dataUri: text.startsWith('data:image/png;base64,'),
      chars: text.length,
      dims: document.querySelector('.metastrip__name span')?.textContent.trim() || '',
    };
  })()`);
  ok(urlRec.dataUri, "URL-loaded record is a PNG Data URI");
  ok(/180\s*×\s*180/.test(urlRec.dims), "URL-loaded record reports its true size", urlRec.dims);

  /* --- 5. invalid URL is reported, not swallowed --- */
  await cdp.eval(`(() => {
    document.querySelector('.alert__close')?.click();
    const input = document.querySelector('#urlInput');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'definitely not a url');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await sleep(120);
  await cdp.eval(`document.querySelector('#urlInput').parentElement.querySelector('button').click()`);
  const alertShown = await cdp.waitFor(`!!document.querySelector('.alert')`, { timeout: 5000 });
  ok(!!alertShown, "an invalid URL surfaces a visible alert");
  await cdp.eval(`document.querySelector('.alert__close')?.click()`);

  /* --- 6. non-image file is rejected with a message --- */
  await cdp.eval(`(() => {
    const input = document.querySelector('input[type=file]');
    const dt = new DataTransfer();
    dt.items.add(new File([new TextEncoder().encode('hello')], 'notes.txt', { type: 'text/plain' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  const rejectShown = await cdp.waitFor(`!!document.querySelector('.alert')`, { timeout: 5000 });
  ok(!!rejectShown, "a non-image file is rejected with a visible alert");

  const pageErrors = consoleErrors.filter((e) => e.page === path);
  ok(pageErrors.length === 0, "no console errors or uncaught exceptions",
    pageErrors.map((e) => `[${e.kind}] ${e.text}`).join("\n          ").slice(0, 400));
}

/* ------------------------------------------------------------------ *
 * Narrow-viewport header
 *
 * The language switcher grows by one pill per shipped language, and the
 * header is a single non-wrapping flex row — so adding a language is
 * exactly the kind of change that silently overflows a phone. Measured
 * rather than estimated: the last pill's right edge is compared against
 * the viewport, not against a guess about text widths.
 * ------------------------------------------------------------------ */

async function testNarrowHeader(cdp, origin, path, consoleErrors) {
  console.log(`\n=== NARROW 360px  ${path} ===`);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 640,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await cdp.send("Page.navigate", { url: origin + path });
  await cdp.waitFor("document.readyState === 'complete'");

  const m = await cdp.eval(`(() => {
    const inner = document.querySelector('.nav__inner');
    const pills = document.querySelectorAll('.lang__btn');
    const last = pills[pills.length - 1];
    const r = last ? last.getBoundingClientRect() : null;
    const brand = document.querySelector('.nav__brand');
    const b = brand ? brand.getBoundingClientRect() : null;
    return {
      buttons: pills.length,
      navScrollWidth: inner.scrollWidth,
      navClientWidth: inner.clientWidth,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      lastRight: r ? Math.round(r.right) : -1,
      lastLeft: r ? Math.round(r.left) : -1,
      brandRight: b ? Math.round(b.right) : -1,
      brandLeft: b ? Math.round(b.left) : -1,
    };
  })()`);

  // Mirrors LANGS in src/lib/site.ts — kept literal for the same reason
  // the SEO verifier keeps its own copy of the routing table.
  const EXPECTED_LANGS = 3;

  ok(m.buttons === EXPECTED_LANGS,
    `all ${EXPECTED_LANGS} language buttons rendered (found ${m.buttons})`);
  ok(m.navScrollWidth <= m.navClientWidth + 1,
    "header row fits without overflow",
    `scrollWidth ${m.navScrollWidth} vs clientWidth ${m.navClientWidth}`);
  ok(m.docScrollWidth <= m.docClientWidth + 1,
    "page has no horizontal scroll at 360px",
    `document scrollWidth ${m.docScrollWidth} vs clientWidth ${m.docClientWidth}`);
  ok(m.lastRight > 0 && m.lastRight <= 360,
    "last language button sits inside the viewport",
    `right edge at ${m.lastRight}px`);
  ok(m.brandLeft >= 0 && m.brandRight < m.lastLeft,
    "brand and switcher do not overlap",
    `brand right ${m.brandRight}px vs switcher left ${m.lastLeft}px`);

  const narrowErrors = consoleErrors.filter((e) => e.page === path);
  ok(narrowErrors.length === 0, "no console errors at 360px",
    narrowErrors.map((e) => `[${e.kind}] ${e.text}`).join("\n          ").slice(0, 400));

  await cdp.send("Emulation.clearDeviceMetricsOverride");
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

if (!existsSync(OUT)) {
  console.error(`No ${OUT} directory — run \`npm run build\` first.`);
  process.exit(1);
}

const browser = findBrowser();
if (!browser) {
  console.log("No Chrome or Edge found; skipping the browser smoke test.");
  console.log("Set CHROME_PATH to run it.");
  process.exit(0);
}

const server = await serve(OUT);
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = mkdtempSync(join(tmpdir(), "b64-smoke-"));
let chrome;

console.log("Base64 Studio — browser smoke test");
console.log(`browser: ${browser}`);
console.log(`serving: ${origin}`);

try {
  chrome = spawn(
    browser,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-sync",
      "--mute-audio",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  // Chrome writes the chosen port here once the DevTools endpoint is live.
  const portFile = join(profile, "DevToolsActivePort");
  let devtoolsPort = null;
  for (let i = 0; i < 100; i++) {
    if (existsSync(portFile)) {
      devtoolsPort = readFileSync(portFile, "utf8").split("\n")[0].trim();
      if (devtoolsPort) break;
    }
    await sleep(100);
  }
  if (!devtoolsPort) throw new Error("Chrome never opened its DevTools port");

  let target = null;
  for (let i = 0; i < 60; i++) {
    const list = await fetchJson(`http://127.0.0.1:${devtoolsPort}/json/list`);
    target = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (target) break;
    await sleep(150);
  }
  if (!target) throw new Error("no debuggable page target");

  const cdp = await Cdp.connect(target.webSocketDebuggerUrl);
  const consoleErrors = [];
  let currentPath = "/";

  cdp.on((msg) => {
    if (msg.method === "Runtime.exceptionThrown") {
      consoleErrors.push({
        page: currentPath,
        kind: "exception",
        text: msg.params.exceptionDetails?.exception?.description?.split("\n")[0] || "unknown",
      });
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      consoleErrors.push({
        page: currentPath,
        kind: "console.error",
        text: (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200),
      });
    } else if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
      consoleErrors.push({
        page: currentPath,
        kind: "log",
        text: msg.params.entry.text.slice(0, 200),
      });
    }
  });

  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Page.enable");

  /* English is the default language, so it is served from the site root;
     Chinese lives under /zh/, German under /de/. Every language is
     exercised, because a routing change that only half-lands would still
     leave the others working. */
  currentPath = "/";
  await testPage(cdp, origin, "/", "en", consoleErrors);
  currentPath = "/zh/";
  await testPage(cdp, origin, "/zh/", "zh", consoleErrors);
  currentPath = "/de/";
  await testPage(cdp, origin, "/de/", "de", consoleErrors);

  /* Run last, because it overrides the emulated viewport. */
  currentPath = "/de/ (360px)";
  await testNarrowHeader(cdp, origin, "/de/", consoleErrors);
} catch (e) {
  failures.push("smoke run aborted");
  console.error(`\nAborted: ${e.message}`);
} finally {
  if (chrome) chrome.kill();
  server.close();
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* the OS will reap the temp profile */
  }
}

console.log(`\n${"-".repeat(52)}`);
console.log(`elapsed ${((Date.now() - start) / 1000).toFixed(1)}s`);
if (failures.length) {
  console.log(`${pass} passed, ${failures.length} FAILED:`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`All ${pass} checks passed.`);
