/**
 * Decoding core — framework-free, mirroring the shape of `convert.ts`.
 *
 * Everything here is pure browser-side logic with no React and no i18n
 * dependency: failures are returned as error *codes* and mapped to
 * messages by the UI layer, so one implementation serves all three
 * language versions of the page.
 *
 * The hard part of this direction is not the decoding. `atob` is a single
 * call. The hard part is deciding what the bytes *are*: a raw base64
 * string carries no type information at all, and the `data:` prefix — when
 * there is one — is a label the user's clipboard wrote, not a fact. So the
 * format is always taken from the bytes, and the prefix is only ever
 * reported alongside.
 */

import { MAX_BYTES, MIME_EXT, bytesToBase64 } from "./convert";

/* ------------------------------------------------------------------ *
 * Limits
 * ------------------------------------------------------------------ */

/**
 * The longest base64 string that can still fit in the shared 10 MB
 * ceiling.
 *
 * Base64 spends 4 characters per 3 bytes, so the limit is
 * ceil(bytes / 3) * 4 = 13,981,016 characters. Derived from the same
 * constant the forward tool enforces rather than restated, so the two
 * directions can never disagree about what "too big" means.
 *
 * The guard is applied to the string's *length* before anything is
 * decoded. That order matters: `atob` on a 500 MB paste would allocate the
 * decoded buffer first and only then let a size check fail, which is how a
 * tab runs out of memory. Refusing on length costs one integer comparison.
 */
export const MAX_CHARS = Math.ceil(MAX_BYTES / 3) * 4;

/** Suggested base name for the downloaded file. */
export const DECODED_BASE = "base64-decoded";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type DecodeError =
  /** Nothing was pasted. */
  | { code: "empty" }
  /** Characters outside the base64 alphabet — usually copy-paste debris. */
  | { code: "chars"; chars: string }
  /** Valid alphabet, but a length base64 cannot produce: cut off mid-string. */
  | { code: "truncated"; length: number }
  /** Over MAX_CHARS; refused before any decoding is attempted. */
  | { code: "tooLarge"; size: number; limit: number }
  /** Decoded cleanly, but the bytes are not a recognisable image format. */
  | { code: "notImage" };

export type Decoded = {
  mime: string;
  /** Lower-case extension for file names, e.g. "png". */
  ext: string;
  /** Upper-case extension for badges, e.g. "PNG". */
  extLabel: string;

  bytes: Uint8Array;
  byteLength: number;

  /** Length of the normalised base64 payload that produced these bytes.
      Kept so the UI can show how much the text form shrank. */
  inputChars: number;

  /** Object URL for the preview. Must be revoked when replaced. */
  previewUrl: string;
  /** False when the browser cannot render this format in an <img>. */
  renderable: boolean;
  width: number;
  height: number;

  /** True when the format was read from magic bytes rather than a prefix. */
  sniffed: boolean;
  hadPrefix: boolean;
  /** MIME the data: prefix claimed, if there was a prefix. */
  declaredMime: string | null;
  /** The prefix's claim when it disagrees with the bytes, else null. */
  prefixMismatch: string | null;

  /** Suggested download name, dimensions included once they are known. */
  name: string;
};

export type DecodeResult =
  | { ok: true; decoded: Decoded }
  | { ok: false; error: DecodeError };

/* ------------------------------------------------------------------ *
 * Normalisation
 *
 * A pasted string is rarely exactly what `btoa` produced. It arrives with
 * quotes from a log line, a data: prefix from a CSS rule or an API
 * response, newlines from a terminal, and — if it came out of a URL or a
 * JSON Web Token — the URL-safe alphabet with its padding stripped. All of
 * that is deterministic, so all of it is normalised here rather than
 * being reported as an error the user has to fix by hand.
 * ------------------------------------------------------------------ */

export type Normalized = {
  /** Standard alphabet, padding restored, whitespace removed. */
  payload: string;
  declaredMime: string | null;
  hadPrefix: boolean;
  hadWhitespace: boolean;
  wasUrlSafe: boolean;
  padded: boolean;
  /** Unique characters outside the alphabet, at most 8, for the message. */
  illegal: string;
};

/** `data:[<mime>][;charset=…][;base64],<payload>` — only the head is needed. */
const DATA_URI = /^data:([^,]*),(.*)$/is;

/** `url("data:…")` or `url( data:… )`, as copied out of a stylesheet. */
const CSS_URL = /^url\(\s*(['"]?)([\s\S]*)\1\s*\)$/i;

const QUOTES = /^(['"`])([\s\S]*)\1$/;

/**
 * Remove the wrappers a string picks up in transit, in the order that
 * actually nests: `url("…")` contains quotes, and a quoted string may
 * contain a data: URI.
 *
 * Getting this order wrong is subtle — strip the quotes last and
 * `"data:image/png;base64,AAA"` keeps its leading quote, which the
 * alphabet scan then reports as illegal `"`.
 */
function unwrap(input: string): string {
  let s = String(input ?? "").trim();

  const css = CSS_URL.exec(s);
  if (css) s = css[2].trim();

  const q = QUOTES.exec(s);
  if (q) s = q[2].trim();

  return s;
}

/** Split a `data:` head into its MIME. `image/jpg` is normalised to
    `image/jpeg` — the two names the same format, and comparing a prefix
    against a sniffed MIME must not fail on that alone. */
function mimeFromHead(head: string): string | null {
  const first = head.split(";")[0].trim().toLowerCase();
  if (!first.includes("/")) return null;
  return first === "image/jpg" ? "image/jpeg" : first;
}

/**
 * The MIME a `data:` prefix claims, without decoding anything.
 *
 * Exists so the interface can show "prefix says image/png" the moment a
 * string is pasted, while the badge still waits for the bytes. Cheap by
 * design: one regex over the head, never the payload.
 */
export function readDeclaredMime(input: string): string | null {
  const uri = DATA_URI.exec(unwrap(input));
  return uri ? mimeFromHead(uri[1]) : null;
}

export function normalizeBase64(input: string): Normalized {
  let s = unwrap(input);

  // 1. A data: prefix is stripped but remembered — the declared type is
  //    useful as a cross-check once the real format is sniffed.
  let declaredMime: string | null = null;
  let hadPrefix = false;
  const uri = DATA_URI.exec(s);
  if (uri) {
    hadPrefix = true;
    declaredMime = mimeFromHead(uri[1]);
    s = uri[2];
  }

  const hadWhitespace = /\s/.test(s);
  if (hadWhitespace) s = s.replace(/\s+/g, "");

  // 2. URL-safe alphabet. `-` and `_` stand in for `+` and `/`; a string
  //    containing either is a JWT, a URL fragment or a filename-safe
  //    encoding, never a different format.
  const wasUrlSafe = /[-_]/.test(s);
  if (wasUrlSafe) s = s.replace(/-/g, "+").replace(/_/g, "/");

  // 3. Padding. Trailing `=` is structural, not data: it is stripped and
  //    recomputed, so a string that lost its padding in transit — a URL
  //    fragment, a JWT, a filename-safe encoding — is still accepted.
  //    An `=` anywhere but the end is left in place and caught by the
  //    alphabet scan below, which is the correct place for it.
  const body = s.replace(/=+$/, "");
  const padded = body.length % 4 === 2 || body.length % 4 === 3;

  // 4. Anything left outside the alphabet is real debris. Collected
  //    uniquely and capped, so the message can name what went wrong
  //    without echoing a megabyte back at the user.
  const seen = new Set<string>();
  for (let i = 0; i < body.length && seen.size < 8; i++) {
    const c = body[i];
    if (!isBase64Char(c)) seen.add(c);
  }

  return {
    payload: body,
    declaredMime,
    hadPrefix,
    hadWhitespace,
    wasUrlSafe,
    padded,
    illegal: [...seen].join(""),
  };
}

function isBase64Char(c: string): boolean {
  return (
    (c >= "A" && c <= "Z") ||
    (c >= "a" && c <= "z") ||
    (c >= "0" && c <= "9") ||
    c === "+" ||
    c === "/"
  );
}

/* ------------------------------------------------------------------ *
 * Format sniffing
 *
 * The single source of truth for "what is this". A data: prefix is a
 * string the user pasted; these are the bytes themselves.
 * ------------------------------------------------------------------ */

const MAGIC_LEN = 32;

export function sniffMime(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length < 4) return null;

  // PNG — the full 8-byte signature, not just the first four: 89 50 4E 47
  // followed by anything is not a PNG, and the extra four bytes cost
  // nothing.
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  )
    return "image/png";

  // JPEG — SOI marker plus the start of the first segment. Requiring the
  // third byte rules out a bare FF D8, which is one byte too generic.
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";

  // GIF87a / GIF89a
  if (
    b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 &&
    (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61
  )
    return "image/gif";

  // BMP
  if (b[0] === 0x42 && b[1] === 0x4d) return "image/bmp";

  // WebP — RIFF container whose form type is WEBP
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return "image/webp";

  // ICO / CUR — the only format here that starts with a run of zero bytes
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00)
    return "image/x-icon";

  // ISO base media container: [size][ftyp][brand…]. AVIF lives here, and
  // so does HEIC — which browsers still cannot render — so the brand has
  // to be read rather than assumed. The major brand comes first, then the
  // compatible-brand list; "avif" appears in either position depending on
  // the encoder, so the whole box is scanned.
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const boxSize = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
    const end = Math.min(boxSize || b.length, b.length);
    for (let i = 8; i + 4 <= end; i += 4) {
      const brand = String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
      if (brand === "avif" || brand === "avis") return "image/avif";
    }
    return null;
  }

  return null;
}

/**
 * SVG is markup, so it is recognised from text rather than from bytes.
 *
 * The start of the document must be XML-ish *and* an `<svg` element must
 * appear, because either test alone produces false positives: plenty of
 * binary decodes to a replacement-character soup containing no `<`, and a
 * stray "<svg" inside a run of text is not a document.
 */
export function looksLikeSvg(bytes: Uint8Array): boolean {
  const head = new TextDecoder("utf-8", { fatal: false }).decode(
    bytes.subarray(0, Math.min(bytes.length, 8192))
  );
  const text = head.replace(/^\uFEFF/, "").replace(/^[\s\r\n]+/, "");

  if (!/^<(\?xml|!--|!doctype\s+svg|svg[\s>])/i.test(text)) return false;
  return /<svg[\s>]/i.test(text);
}

/* ------------------------------------------------------------------ *
 * Decoding
 * ------------------------------------------------------------------ */

/** Base64 payload (standard alphabet, padding optional) → bytes. */
export function base64ToBytes(payload: string): Uint8Array {
  const body = payload.replace(/=+$/, "");
  const pad = body.length % 4 === 0 ? "" : "=".repeat(4 - (body.length % 4));
  const binary = atob(body + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function mimeToExt(mime: string): string {
  return MIME_EXT[mime] || "png";
}

export function extLabelOf(mime: string): string {
  return mimeToExt(mime).toUpperCase();
}

/**
 * Turn a pasted string into an image record.
 *
 * The checks run in cost order, cheapest first, and every one of them
 * happens before the expensive step it guards:
 *
 *   1. empty        — no allocation
 *   2. illegal chars— one scan of the string
 *   3. length       — one comparison, and it comes *before* atob
 *   4. base64 length— one comparison, before atob
 *   5. atob         — the only step that allocates
 *   6. sniff        — bytes only
 *
 * Preview dimensions are read by the caller, which owns the async image
 * load; this function stays synchronous so it can be unit-tested without
 * a DOM.
 */
export function decodeInput(input: string): DecodeResult {
  const norm = normalizeBase64(input);

  if (!norm.payload) return { ok: false, error: { code: "empty" } };

  if (norm.illegal) {
    return { ok: false, error: { code: "chars", chars: norm.illegal } };
  }

  if (norm.payload.length > MAX_CHARS + 4) {
    return {
      ok: false,
      error: {
        code: "tooLarge",
        size: norm.payload.length,
        limit: MAX_CHARS,
      },
    };
  }

  // Base64 encodes 3 bytes into 4 characters, so a body length of
  // 4n + 1 is arithmetically impossible — the string was cut. Detecting
  // this here gives the user "the string is truncated" instead of
  // `atob`'s "InvalidCharacterError", which points at nothing.
  const rem = norm.payload.length % 4;
  if (rem === 1) {
    return {
      ok: false,
      error: { code: "truncated", length: norm.payload.length },
    };
  }

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(norm.payload);
  } catch {
    // Padding-repaired length is valid but the content still failed —
    // treat it the same as a length problem, since the alphabet scan
    // already passed and cut-off strings are the remaining cause.
    return {
      ok: false,
      error: { code: "truncated", length: norm.payload.length },
    };
  }

  if (!bytes.length) return { ok: false, error: { code: "empty" } };

  const detected = sniffMime(bytes.subarray(0, MAGIC_LEN)) ?? (looksLikeSvg(bytes) ? "image/svg+xml" : null);

  if (!detected) return { ok: false, error: { code: "notImage" } };

  const declared = norm.declaredMime;
  // A prefix is only a claim. Reporting the disagreement is more useful
  // than silently preferring either side — it tells the user their string
  // came from somewhere that mislabels files.
  const mismatch = declared && declared !== detected ? declared : null;

  const bytesFull = bytes;
  const previewUrl = URL.createObjectURL(
    new Blob([bytesFull as unknown as BlobPart], { type: detected })
  );

  const ext = mimeToExt(detected);
  return {
    ok: true,
    decoded: {
      mime: detected,
      ext,
      extLabel: ext.toUpperCase(),
      bytes: bytesFull,
      byteLength: bytesFull.byteLength,
      inputChars: norm.payload.length,
      previewUrl,
      renderable: true,
      width: 0,
      height: 0,
      sniffed: true,
      hadPrefix: norm.hadPrefix,
      declaredMime: declared,
      prefixMismatch: mismatch,
      name: `${DECODED_BASE}.${ext}`,
    },
  };
}

/** Canonical Data URI for the decoded bytes, for the copy button. */
export function toDataUri(d: Decoded): string {
  return `data:${d.mime};base64,${bytesToBase64(d.bytes)}`;
}

/* ------------------------------------------------------------------ *
 * Download
 * ------------------------------------------------------------------ */

/**
 * Writes the decoded bytes to disk as a real binary file.
 *
 * Deliberately separate from `downloadText` in convert.ts: a blob built
 * from a base64 *string* would save the text, not the image. The object
 * URL is revoked on a timer rather than immediately, because Chrome reads
 * it after `click()` returns.
 */
export function downloadBinary(d: Decoded): string {
  const blob = new Blob([d.bytes as unknown as BlobPart], { type: d.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = d.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return d.name;
}
