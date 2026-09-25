/**
 * Conversion core — framework-free.
 *
 * Everything here is pure browser-side logic with no React and no i18n
 * dependency: failures are returned as error *codes* and mapped to
 * messages by the UI layer, so a single implementation serves both
 * language versions of the page.
 */

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type Source = "local" | "url";

export type Rec = {
  id: string;
  name: string;
  mime: string;
  ext: string;
  /** Byte length of the original asset. */
  fileSize: number;
  /** Character length of the Data URI — what actually gets pasted around. */
  textBytes: number;
  /** Percentage growth of the text form versus the binary form. */
  increase: number;
  rawBase64: string;
  dataUri: string;
  previewUrl: string;
  width: number;
  height: number;
  source: Source;
  /** True when the payload was re-encoded (canvas fallback, so size is approximate). */
  reencoded?: boolean;
};

export type ConvertErrorCode = "read" | "decode";

export class ConvertError extends Error {
  code: ConvertErrorCode;
  constructor(code: ConvertErrorCode) {
    super(code);
    this.code = code;
  }
}

export type LoadError =
  | { code: "empty" }
  | { code: "invalid"; value: string }
  | { code: "type"; contentType: string }
  | { code: "http"; status: number }
  | { code: "cors" }
  | { code: "net" };

export type LoadResult =
  | { ok: true; rec: Rec }
  | { ok: false; error: LoadError };

/* ------------------------------------------------------------------ *
 * Limits and format tables
 * ------------------------------------------------------------------ */

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES_PER_DROP = 20;
export const MAX_RECORDS = 30;

const ALLOWED_MIME =
  /^image\/(png|jpeg|jpg|gif|webp|bmp|x-icon|vnd\.microsoft\.icon|svg\+xml)$/i;
const ALLOWED_EXT = /\.(png|jpe?g|gif|webp|bmp|ico|svg)$/i;

export const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

export type Units = { b: string; kb: string; mb: string };

export function formatBytes(n: number, u: Units): string {
  if (!isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} ${u.b}`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} ${u.kb}`;
  return `${(n / (1024 * 1024)).toFixed(2)} ${u.mb}`;
}

export function formatInt(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* ------------------------------------------------------------------ *
 * File inspection
 * ------------------------------------------------------------------ */

export function mimeOf(file: File): string {
  if (file.type) return file.type.toLowerCase();
  const m = ALLOWED_EXT.exec(file.name || "");
  if (!m) return "";
  const ext = m[1].toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "svg") return "image/svg+xml";
  return `image/${ext}`;
}

export function isProbablyImage(file: File): boolean {
  if (ALLOWED_MIME.test(mimeOf(file))) return true;
  return ALLOWED_EXT.test(file.name || "");
}

export function cleanFileName(name: string): string {
  const base = String(name || "image")
    .replace(/\.[^.]+$/, "")
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return base || "image";
}

export function cleanUrlName(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() || u.hostname;
    const name = last.indexOf(".") > -1 ? last : `${last}.png`;
    return decodeURIComponent(name).slice(0, 80);
  } catch {
    return "remote-image.png";
  }
}

export type Partitioned = {
  accepted: File[];
  rejectedType: File[];
  rejectedSize: File[];
};

export function partitionFiles(fileList: FileList | File[]): Partitioned {
  const files = Array.from(fileList || []).slice(0, MAX_FILES_PER_DROP);
  const out: Partitioned = { accepted: [], rejectedType: [], rejectedSize: [] };
  for (const f of files) {
    if (!isProbablyImage(f)) out.rejectedType.push(f);
    else if (f.size > MAX_BYTES) out.rejectedSize.push(f);
    else out.accepted.push(f);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Base64 encoding
 * ------------------------------------------------------------------ */

const CHUNK = 0x8000; // keep String.fromCharCode.apply off the call-stack limit

export function bytesToBase64(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK) as unknown as number[]
    );
  }
  return btoa(binary);
}

/** UTF-8 safe — replaces the deprecated unescape(encodeURIComponent(...)) trick. */
export function utf8ToBase64(str: string): string {
  return bytesToBase64(new TextEncoder().encode(str));
}

/**
 * Sniff the real container format from magic bytes.
 * The declared MIME type and the actual payload disagree often enough
 * (extensionless URLs, mislabelled servers) that the Data URI must be
 * built from what the bytes say, not from what a header claims.
 */
export function detectRasterMime(buffer: ArrayBuffer, fallback: string): string {
  const b = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 12));
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b[0] === 0x42 && b[1] === 0x4d) return "image/bmp";
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return "image/webp";
  return fallback || "image/png";
}

/* ------------------------------------------------------------------ *
 * Record builder — the single place text metrics are computed,
 * shared by the local-upload and remote-URL paths.
 * ------------------------------------------------------------------ */

type BuildOpts = {
  name: string;
  mime: string;
  size: number;
  rawBase64: string;
  previewUrl?: string | null;
  width?: number;
  height?: number;
  source?: Source;
};

let seq = 0;

export function buildRecord(o: BuildOpts): Rec {
  const dataUri = `data:${o.mime};base64,${o.rawBase64}`;
  const textBytes = dataUri.length;
  return {
    id: `rec-${++seq}`,
    name: o.name,
    mime: o.mime,
    ext: (MIME_EXT[o.mime] || "png").toUpperCase(),
    fileSize: o.size,
    textBytes,
    increase: o.size > 0 ? ((textBytes - o.size) / o.size) * 100 : 0,
    rawBase64: o.rawBase64,
    dataUri,
    previewUrl: o.previewUrl || dataUri,
    width: o.width || 0,
    height: o.height || 0,
    source: o.source || "local",
  };
}

/* ------------------------------------------------------------------ *
 * Small async helpers
 * ------------------------------------------------------------------ */

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new ConvertError("read"));
    fr.readAsText(file);
  });
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image decode error"));
    img.src = src;
  });
}

/* ------------------------------------------------------------------ *
 * Local file → Rec
 * ------------------------------------------------------------------ */

export function convertFile(file: File): Promise<Rec> {
  const declared = mimeOf(file) || "image/png";

  // SVG is markup, not pixels: read it as text so the Base64 payload is
  // the exact original source and cannot be corrupted by binary decoding.
  if (declared === "image/svg+xml") {
    return readAsText(file).then(async (text) => {
      const payload = text.replace(/^\uFEFF/, "");
      const preview = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(payload)}`;
      let width = 0;
      let height = 0;
      try {
        const img = await loadImageElement(preview);
        width = img.naturalWidth || 0;
        height = img.naturalHeight || 0;
      } catch {
        /* dimensions are optional */
      }
      return buildRecord({
        name: file.name,
        mime: "image/svg+xml",
        size: new Blob([payload]).size,
        rawBase64: utf8ToBase64(payload),
        previewUrl: preview,
        width,
        height,
        source: "local",
      });
    });
  }

  return new Promise<Rec>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ConvertError("read"));
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const realMime = detectRasterMime(buffer, declared);

      const meta = new Promise<{ w: number; h: number }>((res) => {
        const fr = new FileReader();
        fr.onload = () => {
          const im = new Image();
          im.onload = () => res({ w: im.naturalWidth || 0, h: im.naturalHeight || 0 });
          im.onerror = () => res({ w: 0, h: 0 });
          im.src = String(fr.result);
        };
        fr.onerror = () => res({ w: 0, h: 0 });
        fr.readAsDataURL(file);
      });

      meta.then((m) => {
        let raw: string;
        try {
          // The Base64 payload and the Data URI MIME prefix are derived from
          // the same bytes, so they can never disagree about the format.
          raw = bytesToBase64(buffer);
        } catch {
          reject(new ConvertError("decode"));
          return;
        }
        resolve(
          buildRecord({
            name: file.name,
            mime: realMime,
            size: file.size,
            rawBase64: raw,
            previewUrl: null,
            width: m.w,
            height: m.h,
            source: "local",
          })
        );
      });
    };
    reader.readAsArrayBuffer(file);
  });
}

/* ------------------------------------------------------------------ *
 * URL validation
 * ------------------------------------------------------------------ */

export function validateUrl(
  input: string
): { ok: true; url: string } | { ok: false; reason: "empty" | "invalid"; value: string } {
  const value = String(input || "").trim();
  if (!value) return { ok: false, reason: "empty", value };

  let withProto = value;
  if (!/^https?:\/\//i.test(withProto)) {
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(value)) withProto = `https://${value}`;
    else return { ok: false, reason: "invalid", value };
  }
  try {
    const u = new URL(withProto);
    if (!u.hostname || u.hostname.indexOf(".") === -1)
      return { ok: false, reason: "invalid", value };
    return { ok: true, url: u.href };
  } catch {
    return { ok: false, reason: "invalid", value };
  }
}

/* ------------------------------------------------------------------ *
 * Remote image → Rec
 *
 * Two paths, in order of preference:
 *
 *  1. fetch() + arrayBuffer — used when the origin sends permissive CORS
 *     headers. Preferred because it yields the *exact* byte length, so
 *     "original size" and "size increase" are measured, not estimated.
 *
 *  2. <img> + canvas — used when fetch is blocked at the network layer.
 *     A tainted canvas throws a SecurityError, which is precisely the
 *     CORS case surfaced to the user. The reported size is approximate.
 * ------------------------------------------------------------------ */

async function fetchBytes(url: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const res = await fetch(url, { mode: "cors", credentials: "omit", cache: "no-cache" });
  if (!res.ok) {
    const e = new Error(`http ${res.status}`) as Error & { code: string; status: number };
    e.code = "http";
    e.status = res.status;
    throw e;
  }
  const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const buffer = await res.arrayBuffer();
  return { buffer, contentType };
}

async function loadViaCanvas(url: string): Promise<{
  rawBase64: string;
  mime: string;
  size: number;
  previewUrl: string;
  width: number;
  height: number;
}> {
  let img: HTMLImageElement;
  try {
    img = await loadImageElement(url);
  } catch {
    const e = new Error("img load failed") as Error & { code: string };
    e.code = "imgload";
    throw e;
  }
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) {
    const e = new Error("empty image") as Error & { code: string };
    e.code = "imgload";
    throw e;
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const e = new Error("no 2d context") as Error & { code: string };
    e.code = "imgload";
    throw e;
  }
  ctx.drawImage(img, 0, 0);

  let dataUri: string;
  try {
    dataUri = canvas.toDataURL("image/png");
  } catch {
    const e = new Error("tainted canvas") as Error & { code: string };
    e.code = "cors";
    throw e;
  }

  const idx = dataUri.indexOf(",");
  const raw = idx >= 0 ? dataUri.slice(idx + 1) : "";
  return {
    rawBase64: raw,
    mime: "image/png",
    size: Math.round((raw.length * 3) / 4),
    previewUrl: dataUri,
    width: w,
    height: h,
  };
}

export async function loadRemoteImage(rawUrl: string): Promise<LoadResult> {
  const check = validateUrl(rawUrl);
  if (!check.ok) {
    return {
      ok: false,
      error: check.reason === "empty" ? { code: "empty" } : { code: "invalid", value: check.value },
    };
  }

  const url = check.url;
  const pretty = cleanUrlName(url);

  // ---- path 1: fetch ----
  try {
    const { buffer, contentType } = await fetchBytes(url);
    const ct = contentType || "";
    if (ct && !ct.startsWith("image/") && !ct.includes("xml")) {
      return { ok: false, error: { code: "type", contentType: ct } };
    }
    const mime = detectRasterMime(buffer, ct.startsWith("image/") ? ct : "image/png");
    const rec = buildRecord({
      name: pretty,
      mime,
      size: buffer.byteLength,
      rawBase64: bytesToBase64(buffer),
      previewUrl: null,
      source: "url",
    });
    try {
      const img = await loadImageElement(rec.dataUri);
      rec.width = img.naturalWidth || 0;
      rec.height = img.naturalHeight || 0;
    } catch {
      /* dimensions are optional */
    }
    return { ok: true, rec };
  } catch (e) {
    const code = (e as { code?: string }).code;
    // A 4xx/5xx from the server is indistinguishable from CORS in the
    // browser, so both are reported as the same actionable failure.
    if (code === "http") return { ok: false, error: { code: "cors" } };
    if (code === "type") return { ok: false, error: { code: "type", contentType: "" } };
  }

  // ---- path 2: <img> + canvas ----
  try {
    const r = await loadViaCanvas(url);
    const rec = buildRecord({
      name: pretty,
      mime: r.mime,
      size: r.size,
      rawBase64: r.rawBase64,
      previewUrl: r.previewUrl,
      width: r.width,
      height: r.height,
      source: "url",
    });
    rec.reencoded = true;
    return { ok: true, rec };
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "cors") return { ok: false, error: { code: "cors" } };
    return { ok: false, error: { code: "net" } };
  }
}

/* ------------------------------------------------------------------ *
 * Clipboard — three tiers, because navigator.clipboard is unavailable
 * on file:// and on any non-secure origin.
 * ------------------------------------------------------------------ */

function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

function selectFallback(text: string): void {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.top = "50%";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  window.setTimeout(() => {
    if (ta.parentNode) ta.parentNode.removeChild(ta);
  }, 8000);
}

/**
 * Resolves to "copied" on success. When every clipboard route is blocked
 * the text is selected in the document instead, so the user still has a
 * one-keystroke path — that is reported as "selected", never as a silent
 * failure.
 */
export async function copyText(text: string): Promise<"copied" | "selected"> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      if (legacyCopy(text)) return "copied";
      selectFallback(text);
      return "selected";
    }
  }
  if (legacyCopy(text)) return "copied";
  selectFallback(text);
  return "selected";
}

/* ------------------------------------------------------------------ *
 * Download
 * ------------------------------------------------------------------ */

export function downloadText(text: string, baseName: string, suffix: string): string {
  const name = `${baseName}.${suffix}.txt`;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return name;
}
