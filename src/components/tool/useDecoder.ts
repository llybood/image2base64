"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAX_BYTES, copyText, formatBytes, formatInt } from "@/lib/convert";
import {
  MAX_CHARS,
  decodeInput,
  downloadBinary,
  extLabelOf,
  readDeclaredMime,
  toDataUri,
  type DecodeError,
  type Decoded,
} from "@/lib/decode";
import { dict, t as tr, unitsOf } from "@/lib/dict";
import type { Lang } from "@/lib/site";
import { useToasts } from "./useToasts";

export type AlertKind = "error" | "warn" | "info";
export type Badge = "idle" | "busy" | "done" | "error";

type Alert = { title: string; desc: string; kind: AlertKind } | null;

/**
 * Debounce, scaled by payload size.
 *
 * Decoding is cheap but not free: 10 MB of base64 is ~14 M characters and
 * costs roughly 150 ms across `atob`, the byte copy and the Blob. Holding
 * that to a fixed 220 ms would let a long paste re-enter mid-decode while
 * the user is still pasting. The padding is what keeps typing into the
 * field responsive without making short strings feel laggy.
 */
function debounceFor(chars: number): number {
  if (chars > 500_000) return 520;
  if (chars > 60_000) return 340;
  return 220;
}

export function useDecoder(lang: Lang) {
  const d = dict[lang];
  const units = useMemo(() => unitsOf(d), [d]);
  const t = useCallback(
    (key: keyof typeof d, vars?: Record<string, string | number>) => tr(d, key, vars),
    [d]
  );

  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [badge, setBadge] = useState<Badge>("idle");
  const [alert, setAlert] = useState<Alert>(null);
  const [copied, setCopied] = useState(false);

  const { toasts, toast } = useToasts();

  const copyTimer = useRef<number | undefined>(undefined);
  const previewRef = useRef<string | null>(null);
  /** Guards async image callbacks: a decode that has been superseded by a
      newer one must not write its dimensions into the newer record. */
  const epochRef = useRef(0);
  const fieldRef = useRef<HTMLTextAreaElement | null>(null);

  /* ---------------- error text mapping ----------------
     decode.ts reports codes, never prose — the message is resolved here
     so one decoding core serves every language. */

  const decodeErrorText = useCallback(
    (err: DecodeError): { title: string; desc: string } => {
      switch (err.code) {
        case "empty":
          return { title: t("decErrEmpty"), desc: t("decErrEmptyDesc") };
        case "chars":
          return {
            title: t("decErrChars"),
            desc: t("decErrCharsDesc", { chars: err.chars }),
          };
        case "truncated":
          return {
            title: t("decErrTruncated"),
            desc: t("decErrTruncatedDesc", { len: formatInt(err.length) }),
          };
        case "tooLarge":
          return {
            title: t("decErrTooLarge"),
            desc: t("decErrTooLargeDesc", {
              // The string's own footprint — base64 is ASCII, so its
              // character count and its byte count are the same number.
              size: formatBytes(err.size, units),
              limit: formatBytes(MAX_BYTES, units),
            }),
          };
        default:
          return { title: t("decErrNotImage"), desc: t("decErrNotImageDesc") };
      }
    },
    [t, units]
  );

  /* ---------------- preview lifetime ----------------
     A blob URL pins its Blob in memory until revoked, so every replacement
     path has to release the previous one — including unmount. */

  const releasePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  /* ---------------- decode ---------------- */

  const runDecode = useCallback(
    (raw: string) => {
      const epoch = ++epochRef.current;
      setBadge("busy");

      const result = decodeInput(raw);

      if (!result.ok) {
        releasePreview();
        setDecoded(null);
        setBadge("error");
        // "Nothing here yet" is not an error worth a banner — it is the
        // resting state of an empty field.
        setAlert(
          result.error.code === "empty"
            ? null
            : { ...decodeErrorText(result.error), kind: "error" }
        );
        return;
      }

      const next = result.decoded;
      releasePreview();
      previewRef.current = next.previewUrl;
      setDecoded(next);
      setBadge("done");
      setAlert(null);

      // Measuring the image is a second, independent step. A failure here
      // is not a decode failure: the bytes are a real image and the sniff
      // said so, the browser simply cannot paint this format. The record
      // survives with renderable:false so the interface offers the
      // download instead of a broken preview.
      const img = new Image();
      const settle = (renderable: boolean, w: number, h: number) => {
        if (epochRef.current !== epoch) return;
        setDecoded((cur) =>
          cur && cur.previewUrl === next.previewUrl
            ? { ...cur, renderable, width: w, height: h }
            : cur
        );
      };
      img.onload = () => settle(true, img.naturalWidth || 0, img.naturalHeight || 0);
      img.onerror = () => settle(false, 0, 0);
      img.src = next.previewUrl;
    },
    [decodeErrorText, releasePreview]
  );

  /* ---------------- decode on input, debounced ---------------- */

  useEffect(() => {
    const raw = input;

    if (!raw.trim()) {
      epochRef.current += 1;
      releasePreview();
      setDecoded(null);
      setBadge("idle");
      setAlert(null);
      return;
    }

    const id = window.setTimeout(() => runDecode(raw), debounceFor(raw.length));
    return () => window.clearTimeout(id);
  }, [input, runDecode, releasePreview]);

  useEffect(
    () => () => {
      releasePreview();
      window.clearTimeout(copyTimer.current);
    },
    [releasePreview]
  );

  /* ---------------- clipboard ---------------- */

  const pasteFrom = useCallback(async () => {
    try {
      if (!navigator.clipboard?.readText) throw new Error("unavailable");
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast(t("decErrEmpty"), "info");
        return;
      }
      setInput(text);
      toast(t("decOkPasted"), "ok");
    } catch {
      setAlert({ title: t("decErrPaste"), desc: t("decErrPasteDesc"), kind: "error" });
      toast(t("decErrPaste"), "err");
    }
  }, [t, toast]);

  /**
   * Document-level paste, so that pasting anywhere on the page works —
   * which is the whole gesture this tool is built around.
   *
   * It stands down when the textarea already has focus: the browser
   * inserts the text natively there, and handling it here as well would
   * write the same string twice. `t` and `toast` are both stable for the
   * life of the page, so this listener is registered exactly once.
   */
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const field = fieldRef.current;
      const focused = document.activeElement;
      if (field && focused === field) return;
      if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) return;

      const cd = e.clipboardData;
      const text = cd ? cd.getData("text/plain") : "";
      if (!text || !text.trim()) return;

      e.preventDefault();
      setInput(text);
      toast(t("decOkPasted"), "ok");
    };

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [t, toast]);

  const clear = useCallback(() => {
    setInput("");
    setAlert(null);
  }, []);

  const copyUri = useCallback(async () => {
    if (!decoded) return;
    const outcome = await copyText(toDataUri(decoded));

    if (outcome === "copied") {
      toast(t("decOkCopied"), "ok");
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
    } else {
      // Every clipboard route was blocked; the text has been selected in
      // the document instead, so say exactly that rather than "failed".
      setAlert({
        title: t("errCopy"),
        desc: `${t("errCopyDesc")} ${t("errCopyFallbackDesc")}`,
        kind: "error",
      });
      toast(t("errCopy"), "err");
    }
  }, [decoded, t, toast]);

  const download = useCallback(() => {
    if (!decoded) return;
    const name = downloadBinary(decoded);
    toast(t("decOkDownloaded", { name }), "ok");
  }, [decoded, t, toast]);

  /* ---------------- derived ---------------- */

  const hasInput = input.trim().length > 0;
  const declaredMime = useMemo(() => readDeclaredMime(input), [input]);

  /**
   * The "Detected" line, in its three possible states: a prefix claim
   * while decoding is still pending, the measured format once it lands,
   * and a mismatch warning when the two disagree.
   */
  const detected = useMemo(() => {
    if (decoded) {
      const label = extLabelOf(decoded.mime);
      return {
        pending: null,
        detail:
          decoded.width && decoded.height
            ? t("decDetectedSniffed", {
                mime: label,
                w: formatInt(decoded.width),
                h: formatInt(decoded.height),
              })
            : label,
        mismatch: decoded.prefixMismatch
          ? t("decErrPrefixMismatch", {
              declared: extLabelOf(decoded.prefixMismatch),
              actual: label,
            })
          : null,
      };
    }

    return {
      pending: declaredMime ? t("decDetectedPrefix", { mime: extLabelOf(declaredMime) }) : null,
      detail: null,
      mismatch: null,
    };
  }, [decoded, declaredMime, t]);

  return {
    d,
    t,
    units,
    // state
    input,
    decoded,
    badge,
    alert,
    toasts,
    copied,
    hasInput,
    declaredMime,
    detected,
    // refs
    fieldRef,
    // limits
    maxCharsLabel: formatInt(MAX_CHARS),
    maxBytesLabel: formatBytes(MAX_BYTES, units),
    // actions
    setInput,
    setAlert,
    pasteFrom,
    clear,
    copyUri,
    download,
    toast,
    formatBytes: (n: number) => formatBytes(n, units),
  };
}

export type DecoderApi = ReturnType<typeof useDecoder>;
