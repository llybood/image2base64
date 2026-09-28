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

/* Shared with the CDP event handler, which needs to attribute every
   console message to the page it came from. At module scope rather than
   inside the run block because the cross-tool test navigates between
   pages on its own. */
const consoleErrors = [];
let currentPath = "/";

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
 * Shared page drivers
 * ------------------------------------------------------------------ */

/**
 * Write into a React-controlled <textarea>.
 *
 * Assigning `.value` directly does not notify React — its internal value
 * tracker still holds the old string and swallows the change event. Going
 * through the prototype's own setter bypasses that tracker, so React sees
 * a real edit. Same trick the URL input uses below.
 */
const setTextarea = (cdp, value) =>
  cdp.eval(`(() => {
    const ta = document.querySelector('#b64Input');
    if (!ta) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, ${JSON.stringify(value)});
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);

/**
 * Read the preview back out of the page and compare it byte for byte
 * against a known payload.
 *
 * The bytes come from the <img>'s own object URL rather than from any
 * text on the page, so this measures the artefact the user would
 * download — not a string that merely looks like it. That is the reason
 * the check is written this way: a decoder that produces the right
 * length but the wrong bytes would pass a text comparison.
 */
const checkDecoded = (cdp, wantBase64) =>
  cdp.eval(`(async () => {
    const img = document.querySelector('.preview img');
    if (!img) return { ok: false, why: 'no preview image' };
    let got;
    try {
      got = new Uint8Array(await (await fetch(img.src)).arrayBuffer());
    } catch (e) {
      return { ok: false, why: 'preview not readable: ' + e.message };
    }
    const bin = atob(${JSON.stringify(wantBase64)});
    if (got.length !== bin.length) {
      return { ok: false, why: 'length', got: got.length, want: bin.length };
    }
    for (let i = 0; i < bin.length; i++) {
      if (got[i] !== bin.charCodeAt(i)) return { ok: false, why: 'byte ' + i };
    }
    return {
      ok: true,
      bytes: got.length,
      detected: (document.querySelector('.detected__v') || {}).textContent?.trim() || '',
      stats: [...document.querySelectorAll('.stat')].map((s) =>
        s.querySelector('.stat__k').textContent.trim() + '=' +
        s.querySelector('.stat__v').textContent.trim()
      ).join(', '),
    };
  })()`);

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
 * Reverse tool (base64 → image)
 * ------------------------------------------------------------------ */

async function testDecoderPage(cdp, origin, path, lang, consoleErrors) {
  console.log(`\n=== ${lang.toUpperCase()} / decode  ${path} ===`);

  await cdp.send("Page.navigate", { url: origin + path });
  const loaded = await cdp.waitFor("document.readyState === 'complete'");
  ok(!!loaded, `page reaches readyState=complete (${since()})`);

  /* --- hydration ---
     The status badge is language-independent (it is a class, not text),
     which matters because this same assertion runs against all three
     language pages. An illegal character is the cheapest way to drive a
     state change that only a hydrated component can produce. */
  const hydrated = await cdp.waitFor(
    `(async () => {
       const ta = document.querySelector('#b64Input');
       if (!ta) return false;
       const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
       setter.call(ta, 'this is not base64 !!');
       ta.dispatchEvent(new Event('input', { bubbles: true }));
       await new Promise((r) => setTimeout(r, 500));
       return !!document.querySelector('.badge--err');
     })()`,
    { timeout: 15000 }
  );
  ok(!!hydrated, "React hydrates (an illegal string flips the badge to error)");
  if (!hydrated) return;

  /* --- server-rendered shell --- */
  const shell = await cdp.eval(`(() => {
    const h1 = document.querySelectorAll('h1');
    return {
      lang: document.documentElement.getAttribute('lang'),
      headingCount: h1.length,
      h1: h1[0] ? h1[0].textContent.trim().slice(0, 80) : '',
      textarea: !!document.querySelector('#b64Input'),
      pasteBtn: !!document.querySelector('.pasterow .btn'),
      detected: !!document.querySelector('.detected'),
      // The encoder's controls must be absent: mounting both tools on one
      // page would register two document-level paste listeners.
      dropzone: !!document.querySelector('#dropzone'),
      codeText: !!document.querySelector('#codeText'),
    };
  })()`);
  const expectedLang = { en: "en", zh: "zh-CN", de: "de" }[lang];
  ok(shell.lang === expectedLang, `<html lang> stays ${expectedLang}`, `got ${shell.lang}`);
  ok(shell.headingCount === 1, "exactly one h1 after hydration", `found ${shell.headingCount}`);
  ok(shell.textarea && shell.pasteBtn && shell.detected,
    "decoder controls present (textarea, paste button, detected line)");
  ok(!shell.dropzone && !shell.codeText,
    "the encoder's controls are not mounted on the decoder page");

  const png = fixture(FIXTURES.png);

  /* --- 1. raw base64 → byte-exact image --- */
  await setTextarea(cdp, png.base64);
  const previewReady = await cdp.waitFor(`!!document.querySelector('.preview img')`, {
    timeout: 10000,
  });
  ok(!!previewReady, "raw base64 decodes to a previewable image");

  const raw = await checkDecoded(cdp, png.base64);
  ok(raw.ok, `preview bytes match the original ${png.size} bytes`,
    raw.ok ? undefined : JSON.stringify(raw));
  ok(raw.ok && /PNG/.test(raw.detected),
    "the format is reported as PNG with no prefix to go on", raw.detected);
  ok(raw.ok && /180\s*×\s*180/.test(raw.stats),
    "the record reports the image's real pixel dimensions", raw.stats);

  /* --- 2. a wrong data: prefix loses to the bytes --- */
  await setTextarea(cdp, `data:image/jpeg;base64,${png.base64}`);
  const mismatched = await cdp.waitFor(
    `!!document.querySelector('.detected__v--warn')`,
    { timeout: 10000 }
  );
  ok(!!mismatched, "a prefix that contradicts the bytes raises a mismatch warning");
  const byBytes = await checkDecoded(cdp, png.base64);
  ok(byBytes.ok, "the bytes win: the image is still decoded as PNG",
    byBytes.ok ? undefined : JSON.stringify(byBytes));

  /* --- 3. the string may arrive mangled ---
     Line-wrapped, URL-safe alphabet, padding dropped, wrapped in quotes.
     All four are normalisations the decoder claims to perform, so all
     four are asserted at once against the same known-good payload. */
  const mangled = `"\n  ${png.base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .replace(/(.{64})/g, "$1\n  ")}\n"`;
  await setTextarea(cdp, mangled);
  const mangledReady = await cdp.waitFor(`!!document.querySelector('.preview img')`, {
    timeout: 10000,
  });
  ok(!!mangledReady, "a quoted, line-wrapped, URL-safe, unpadded string still decodes");
  const mangledBytes = await checkDecoded(cdp, png.base64);
  ok(mangledBytes.ok, "the normalised string yields the same bytes",
    mangledBytes.ok ? undefined : JSON.stringify(mangledBytes));

  /* --- 4. a truncated string is named as such ---
     Cutting the payload to a length base64 cannot produce (4n + 1) is the
     one failure the alphabet and signature checks cannot explain, so it
     has its own path out of the decoder. */
  const truncated = png.base64.slice(0, png.base64.length - 3);
  await setTextarea(cdp, truncated);
  const truncAlert = await cdp.waitFor(
    `!!document.querySelector('.alert--error')`,
    { timeout: 8000 }
  );
  ok(!!truncAlert, "a truncated string is reported instead of silently failing");
  const noPreview = await cdp.eval(`!document.querySelector('.preview img')`);
  ok(noPreview, "no stale preview survives a failed decode");

  /* --- 5. valid base64 that is not an image --- */
  await setTextarea(cdp, "aGVsbG8gd29ybGQsIHRoaXMgaXMgbm90IGFuIGltYWdlIGF0IGFsbA==");
  const notImage = await cdp.waitFor(`!!document.querySelector('.alert--error')`, {
    timeout: 8000,
  });
  ok(!!notImage, "base64 that is not an image is rejected with a visible alert");

  /* --- 6. clearing returns the page to rest --- */
  await setTextarea(cdp, "");
  const cleared = await cdp.waitFor(
    `!document.querySelector('.preview img') && !document.querySelector('.alert') &&
     !!document.querySelector('.badge:not(.badge--err):not(.badge--ok)')`,
    { timeout: 8000 }
  );
  ok(!!cleared, "clearing the field returns the page to its idle state");

  const pageErrors = consoleErrors.filter((e) => e.page === path);
  ok(pageErrors.length === 0, "no console errors or uncaught exceptions",
    pageErrors.map((e) => `[${e.kind}] ${e.text}`).join("\n          ").slice(0, 400));
}

/* ------------------------------------------------------------------ *
 * Cross-tool round trip
 *
 * The strongest available end-to-end assertion: a real file goes into one
 * tool as bytes, the Base64 it produces is carried across to the other
 * tool the way a user would carry it, and the bytes that come out are
 * compared with the originals. Neither tool is trusted on its own — the
 * check only passes if both agree, which is exactly the contract the site
 * claims.
 * ------------------------------------------------------------------ */

async function testCrossToolRoundTrip(cdp, origin, consoleErrors) {
  console.log(`\n=== CROSS-TOOL  /  →  /base64-to-image/ ===`);

  const png = fixture(FIXTURES.png);

  currentPath = "/";
  await cdp.send("Page.navigate", { url: origin + "/" });
  await cdp.waitFor("document.readyState === 'complete'");
  const hydrated = await cdp.waitFor(
    `(async () => {
       if (document.querySelectorAll('.tab').length < 2) return false;
       document.querySelectorAll('.tab')[1].click();
       await new Promise((r) => setTimeout(r, 80));
       return document.querySelectorAll('.tab')[1].getAttribute('aria-selected') === 'true';
     })()`,
    { timeout: 15000 }
  );
  if (!hydrated) {
    ok(false, "encoder hydrates before the round trip");
    return;
  }

  // Switch back to Data URI mode so the string carried across is the
  // prefixed form, which is what a user would actually copy.
  await cdp.eval(`document.querySelectorAll('.tab')[0].click()`);
  await sleep(120);

  await cdp.eval(`(() => {
    const bin = atob(${JSON.stringify(png.base64)});
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const input = document.querySelector('input[type=file]');
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], ${JSON.stringify(png.name)}, { type: ${JSON.stringify(png.mime)} }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);

  const encoded = await cdp.waitFor(
    `(() => {
       const t = document.querySelector('#codeText').textContent;
       return t.startsWith('data:image/png;base64,') ? t : false;
     })()`,
    { timeout: 10000 }
  );
  ok(!!encoded, "step 1 — the encoder produces a PNG Data URI");
  if (!encoded) return;

  /* The hand-off. The Data URI is copied as text, exactly as a user would
     copy it, and pasted into the other page. Nothing is passed through a
     variable on this side, so the two pages really are communicating the
     way the product advertises. */
  currentPath = "/base64-to-image/";
  await cdp.send("Page.navigate", { url: origin + "/base64-to-image/" });
  await cdp.waitFor("document.readyState === 'complete'");
  await setTextarea(cdp, encoded);

  const previewed = await cdp.waitFor(`!!document.querySelector('.preview img')`, {
    timeout: 15000,
  });
  ok(!!previewed, "step 2 — the decoder accepts the encoder's output");
  if (!previewed) return;

  const roundTrip = await checkDecoded(cdp, png.base64);
  ok(roundTrip.ok,
    `step 3 — ${png.size} bytes survive the round trip through both tools`,
    roundTrip.ok ? undefined : JSON.stringify(roundTrip));

  const errors = consoleErrors.filter(
    (e) => e.page === "/" || e.page === "/base64-to-image/"
  );
  ok(errors.length === 0, "no console errors during the round trip",
    errors.map((e) => `[${e.kind}] ${e.text}`).join("\n          ").slice(0, 400));
}

/* ------------------------------------------------------------------ *
 * Header geometry
 *
 * The header makes two promises that a screenshot cannot confirm and
 * that no other test in this file touches:
 *
 *   - on a desktop it is ONE row: the wordmark left, the two tool tabs
 *     and the language menu side by side on the right;
 *   - on a phone it still does not overflow, because the cluster is
 *     allowed to wrap instead of the labels shrinking.
 *
 * Measured rather than estimated, at two real viewport widths, with real
 * bounding boxes. Both tests emulate a viewport (and clear it on the way
 * out), so they run last.
 * ------------------------------------------------------------------ */

/* Mirrors HTML_LANG and pagePath(decode, lang) in src/lib/site.ts for the
   pages these tests visit. Deliberately literal: an expectation derived
   from the code under test cannot catch that code answering with the
   language root instead of the translated page. */
const HTML_LANG = { en: "en", zh: "zh-CN", de: "de" };
const DECODE_PATHS = {
  en: "/base64-to-image/",
  "zh-CN": "/zh/base64-to-image/",
  de: "/de/base64-to-image/",
};

async function testWideHeader(cdp, origin, path, lang, consoleErrors) {
  console.log(`\n=== WIDE 1440px  ${path} ===`);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send("Page.navigate", { url: origin + path });
  await cdp.waitFor("document.readyState === 'complete'");

  const m = await cdp.eval(`(() => {
    const box = (el) => {
      const r = el ? el.getBoundingClientRect() : null;
      return r ? {
        left: Math.round(r.left), right: Math.round(r.right),
        top: Math.round(r.top), bottom: Math.round(r.bottom),
      } : null;
    };
    const inner = document.querySelector('.nav__inner');
    const brand = document.querySelector('.nav__brand');
    const trigger = document.querySelector('.langmenu__btn');
    const tabs = [...document.querySelectorAll('.tools__btn')];
    const items = [...document.querySelectorAll('.langmenu__item')];
    const marked = (els) => els.filter((a) => a.getAttribute('aria-current') === 'true');

    return {
      inner: box(inner),
      brand: box(brand),
      trigger: box(trigger),
      firstTab: box(tabs[0]),
      lastTab: box(tabs[tabs.length - 1]),
      brandFontSize: brand ? parseFloat(getComputedStyle(brand).fontSize) : -1,
      activeTabPath: marked(tabs).length ? new URL(marked(tabs)[0].href).pathname : null,
      activeLang: marked(items).length ? marked(items)[0].getAttribute('hreflang') : null,
      navScrollWidth: inner ? inner.scrollWidth : -1,
      navClientWidth: inner ? inner.clientWidth : -1,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      activeTabs: marked(tabs).length,
    };
  })()`);

  /* Vertical ranges overlapping is the honest test for "same row"; a
     wrapped header would put one range entirely below the other. */
  const sameRow = (a, b) => !!(a && b && a.top < b.bottom && b.top < a.bottom);
  const inset = (el, edge, sign) =>
    !!(el && m.inner && Math.abs(el[edge] - (m.inner[edge] + sign * 32)) <= 1);

  ok(sameRow(m.brand, m.trigger), "wordmark and language menu share one row",
    `wordmark ${m.brand?.top}-${m.brand?.bottom}px vs menu ${m.trigger?.top}-${m.trigger?.bottom}px`);
  ok(sameRow(m.lastTab, m.trigger), "tool tabs sit beside the language menu, not above it",
    `last tab ${m.lastTab?.top}-${m.lastTab?.bottom}px vs menu ${m.trigger?.top}-${m.trigger?.bottom}px`);
  ok(sameRow(m.brand, m.firstTab), "the wordmark and the tool tabs share one row");
  ok(inset(m.brand, "left", 1), "wordmark starts at the container's left edge",
    m.brand ? `left ${m.brand.left}px vs container ${m.inner.left}px` : "no wordmark found");
  ok(inset(m.trigger, "right", -1), "language menu ends at the container's right edge",
    m.trigger ? `right ${m.trigger.right}px vs container ${m.inner.right}px` : "no menu found");
  ok(m.brandFontSize >= 18, "wordmark is set as a title, not as a label",
    `${m.brandFontSize}px, expected at least 18px`);
  ok(m.activeTabs === 1 && m.activeTabPath === path,
    "exactly the current tool is marked, and it is the page you are on",
    `marked ${m.activeTabs} tab(s) -> ${m.activeTabPath}; page is ${path}`);
  ok(m.activeLang === HTML_LANG[lang], "the reading language is marked in the menu",
    `marked ${m.activeLang}; page is ${HTML_LANG[lang]}`);
  ok(m.navScrollWidth <= m.navClientWidth + 1,
    "the header row fits without overflow",
    `scrollWidth ${m.navScrollWidth} vs clientWidth ${m.navClientWidth}`);
  ok(m.docScrollWidth <= m.docClientWidth + 1,
    "page has no horizontal scroll at 1440px",
    `document scrollWidth ${m.docScrollWidth} vs clientWidth ${m.docClientWidth}`);

  /* Matched against the labelled path the run block set, not against
     `path`: the CDP handler attributes every message to `currentPath`. */
  const errs = consoleErrors.filter((e) => e.page === currentPath);
  ok(errs.length === 0, "no console errors at 1440px",
    errs.map((e) => `[${e.kind}] ${e.text}`).join("\n          ").slice(0, 400));

  await cdp.send("Emulation.clearDeviceMetricsOverride");
}

async function testNarrowHeader(cdp, origin, path, lang, consoleErrors) {
  console.log(`\n=== NARROW 360px  ${path} ===`);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 640,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await cdp.send("Page.navigate", { url: origin + path });
  await cdp.waitFor("document.readyState === 'complete'");

  const probe = `(() => {
    const box = (el) => {
      const r = el ? el.getBoundingClientRect() : null;
      return r ? {
        left: Math.round(r.left), right: Math.round(r.right),
        top: Math.round(r.top), bottom: Math.round(r.bottom),
      } : null;
    };
    const shown = (el) => {
      if (!el) return false;
      if (el.checkVisibility) return el.checkVisibility();
      return el.getBoundingClientRect().height > 0;
    };
    const inner = document.querySelector('.nav__inner');
    const menu = document.querySelector('.langmenu');
    const panel = document.querySelector('.langmenu__panel');
    const items = [...document.querySelectorAll('.langmenu__item')];
    const tabs = [...document.querySelectorAll('.tools__btn')];

    return {
      open: !!(menu && menu.open),
      panelShown: shown(panel),
      panel: box(panel),
      tabs: tabs.length,
      brand: box(document.querySelector('.nav__brand')),
      trigger: box(document.querySelector('.langmenu__btn')),
      lastTab: box(tabs[tabs.length - 1]),
      langs: items.map((a) => ({
        lang: a.getAttribute('hreflang'),
        path: new URL(a.href).pathname,
        current: a.getAttribute('aria-current') === 'true',
      })),
      navScrollWidth: inner ? inner.scrollWidth : -1,
      navClientWidth: inner ? inner.clientWidth : -1,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
    };
  })()`;

  const m = await cdp.eval(probe);

  // Mirrors LANGS and PAGES in src/lib/site.ts — kept literal for the same
  // reason the SEO verifier keeps its own copy of the routing table.
  const EXPECTED_LANGS = 3;
  const EXPECTED_TOOLS = 2;

  ok(m.tabs === EXPECTED_TOOLS, `both tool tabs rendered (found ${m.tabs})`);
  ok(m.langs.length === EXPECTED_LANGS,
    `all ${EXPECTED_LANGS} languages offered in the menu (found ${m.langs.length})`);

  for (const [code, target] of Object.entries(DECODE_PATHS)) {
    const entry = m.langs.find((l) => l.lang === code);
    ok(entry && entry.path === target,
      `the ${code} entry points at this page's own translation`,
      entry ? `got ${entry.path}, want ${target}` : `no entry with hreflang="${code}"`);
  }
  /* The failure this guards against is silent and real: an entry aimed at
     the language root sends the visitor into the other tool, and tells a
     crawler the two pages are translations of each other. */
  ok(!m.langs.some((l) => ["/", "/zh/", "/de/"].includes(l.path)),
    "no language entry targets a language root",
    m.langs.map((l) => `${l.lang} -> ${l.path}`).join(", "));

  const current = m.langs.filter((l) => l.current);
  ok(current.length === 1 && current[0].lang === HTML_LANG[lang],
    "exactly the reading language is marked current",
    current.map((l) => l.lang).join(", ") || "none marked");

  ok(!m.open && !m.panelShown, "the language menu starts collapsed");

  ok(m.brand && m.brand.left >= 0,
    "the wordmark is the leftmost thing in the header",
    m.brand ? `left edge at ${m.brand.left}px` : "no wordmark found");
  ok(m.brand && m.trigger && m.brand.right < m.trigger.left,
    "the wordmark and the language trigger do not overlap",
    `wordmark right ${m.brand?.right}px vs trigger left ${m.trigger?.left}px`);
  ok(m.trigger && m.trigger.right <= 360,
    "the language trigger sits inside the viewport",
    `right edge at ${m.trigger?.right}px`);
  /* The cluster wraps as one unit — the tabs and the menu are children
     of the same flex row — so what is asserted is not "the tabs moved
     down" but the invariant behind it: the cluster is either beside the
     wordmark or on a row that starts below it, and never vertically
     overlapping it. Overlap is what a squeezed overflow looks like, and
     it is the one failure a screenshot of a phone header will not show. */
  const sameRow = !!(m.brand && m.trigger &&
    m.brand.top < m.trigger.bottom && m.trigger.top < m.brand.bottom);
  const ownRow = !!(m.brand && m.trigger && m.trigger.top >= m.brand.bottom - 1);
  ok(sameRow || ownRow,
    "the cluster sits beside the wordmark or on a row of its own, never over it",
    `wordmark ${m.brand?.top}-${m.brand?.bottom}px vs cluster ${m.trigger?.top}-${m.trigger?.bottom}px`);

  ok(m.navScrollWidth <= m.navClientWidth + 1,
    "header fits without overflow",
    `scrollWidth ${m.navScrollWidth} vs clientWidth ${m.navClientWidth}`);
  // The assertion that actually matters: nothing on the page may scroll
  // sideways, whatever the header does internally.
  ok(m.docScrollWidth <= m.docClientWidth + 1,
    "page has no horizontal scroll at 360px",
    `document scrollWidth ${m.docScrollWidth} vs clientWidth ${m.docClientWidth}`);

  /* ---- the disclosure actually works ----------------------------
     Counting the entries proves the markup is there; it does not prove
     a visitor can reach them. Both closing paths are driven, because
     both are custom code: <details> opens and closes itself, but closing
     on an outside click and on Escape is the effect in LangMenu.tsx. */
  await cdp.eval("document.querySelector('.langmenu__btn').click(); true");
  await cdp.waitFor("document.querySelector('.langmenu').open === true");
  const opened = await cdp.eval(probe);
  ok(opened.open && opened.panelShown, "clicking the trigger opens the menu");
  ok(opened.panel && opened.panel.left >= 0 && opened.panel.right <= 360,
    "the open menu stays inside the viewport",
    `panel ${opened.panel?.left}-${opened.panel?.right}px`);

  await cdp.eval(
    "document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); true"
  );
  ok((await cdp.eval("document.querySelector('.langmenu').open")) === false,
    "clicking outside closes the menu");

  await cdp.eval("document.querySelector('.langmenu__btn').click(); true");
  await cdp.waitFor("document.querySelector('.langmenu').open === true");
  await cdp.eval(
    "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); true"
  );
  ok((await cdp.eval("document.querySelector('.langmenu').open")) === false,
    "Escape closes the menu");

  /* Matched against the labelled path the run block set, not against
     `path`: the CDP handler attributes every message to `currentPath`. */
  const narrowErrors = consoleErrors.filter((e) => e.page === currentPath);
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
     Chinese lives under /zh/, German under /de/. Every language of every
     page is exercised, because a routing change that only half-lands
     would still leave the others working. */
  currentPath = "/";
  await testPage(cdp, origin, "/", "en", consoleErrors);
  currentPath = "/base64-to-image/";
  await testDecoderPage(cdp, origin, "/base64-to-image/", "en", consoleErrors);

  currentPath = "/zh/";
  await testPage(cdp, origin, "/zh/", "zh", consoleErrors);
  currentPath = "/zh/base64-to-image/";
  await testDecoderPage(cdp, origin, "/zh/base64-to-image/", "zh", consoleErrors);

  currentPath = "/de/";
  await testPage(cdp, origin, "/de/", "de", consoleErrors);
  currentPath = "/de/base64-to-image/";
  await testDecoderPage(cdp, origin, "/de/base64-to-image/", "de", consoleErrors);

  /* The strongest check in the file, and the only one that exercises both
     tools against each other rather than against a fixture. */
  await testCrossToolRoundTrip(cdp, origin, consoleErrors);

  /* The header tests emulate a viewport, so they run last. Two widths,
     because the header is one row on a desktop and two on a phone, and
     both the encoder and the decoder page are visited so the "current
     tool is marked" assertion is exercised on either side. */
  currentPath = "/ (1440px)";
  await testWideHeader(cdp, origin, "/", "en", consoleErrors);
  currentPath = "/de/base64-to-image/ (1440px)";
  await testWideHeader(cdp, origin, "/de/base64-to-image/", "de", consoleErrors);

  /* The decoder at 360px is the harder of the two: wordmark plus two
     spelled-out tool labels plus the language menu, on a phone. */
  currentPath = "/de/base64-to-image/ (360px)";
  await testNarrowHeader(cdp, origin, "/de/base64-to-image/", "de", consoleErrors);
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
