"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_BYTES,
  MAX_RECORDS,
  MIME_EXT,
  cleanFileName,
  convertFile,
  copyText,
  downloadText,
  formatBytes,
  loadRemoteImage,
  partitionFiles,
  type LoadError,
  type Rec,
} from "@/lib/convert";
import { dict, t as tr, unitsOf } from "@/lib/dict";
import type { Lang } from "@/lib/site";

export type AlertKind = "error" | "warn" | "info";
export type ToastKind = "ok" | "err" | "info";
export type Badge = "idle" | "busy" | "done" | "error";
export type Mode = "uri" | "raw";

type Toast = { id: number; text: string; kind: ToastKind; leaving?: boolean };
type Alert = { title: string; desc: string; kind: AlertKind } | null;

const TOAST_LIMIT = 4;
const TOAST_TTL = 3200;
const TOAST_OUT = 220;

export function useConverter(lang: Lang) {
  const d = dict[lang];
  const units = useMemo(() => unitsOf(d), [d]);
  const t = useCallback(
    (key: keyof typeof d, vars?: Record<string, string | number>) => tr(d, key, vars),
    [d]
  );

  const [records, setRecords] = useState<Rec[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("uri");
  const [badge, setBadge] = useState<Badge>("idle");
  const [alert, setAlert] = useState<Alert>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [urlInvalid, setUrlInvalid] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [copied, setCopied] = useState(false);

  const toastSeq = useRef(0);
  const copyTimer = useRef<number | undefined>(undefined);

  const active = useMemo(
    () => records.find((r) => r.id === activeId) ?? null,
    [records, activeId]
  );

  /* ---------------- toasts ---------------- */

  const toast = useCallback((text: string, kind: ToastKind = "info") => {
    if (!text) return;
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { id, text, kind }].slice(-TOAST_LIMIT));
    // Two-phase removal so the exit animation actually plays before unmount.
    window.setTimeout(() => {
      setToasts((prev) => prev.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    }, TOAST_TTL - TOAST_OUT);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, TOAST_TTL);
  }, []);

  /* ---------------- error text mapping ----------------
     convert.ts reports codes, never prose — the message is resolved here
     so one conversion core serves both languages. */

  const loadErrorText = useCallback(
    (err: LoadError): { title: string; desc: string } => {
      switch (err.code) {
        case "empty":
          return { title: t("errUrlEmpty"), desc: t("errUrlEmptyDesc") };
        case "invalid":
          return {
            title: t("errUrlInvalid", { url: err.value }),
            desc: t("errUrlInvalidDesc", { url: err.value }),
          };
        case "type":
          return {
            title: t("errUrlType"),
            desc: t("errUrlTypeDesc", { type: err.contentType || "unknown" }),
          };
        default:
          return { title: t("errUrlLoad"), desc: t("errUrlLoadDesc") };
      }
    },
    [t]
  );

  /* ---------------- intake ---------------- */

  const ingest = useCallback(
    async (files: File[]) => {
      const { accepted, rejectedType, rejectedSize } = partitionFiles(files);

      if (!accepted.length) {
        if (rejectedType.length) {
          const name = rejectedType[0].name;
          setAlert({
            title: t("errNotImage", { name }),
            desc: t("errNotImageDesc", { name }),
            kind: "error",
          });
          toast(t("errNotImage", { name }), "err");
        } else if (rejectedSize.length) {
          const f = rejectedSize[0];
          const size = formatBytes(f.size, units);
          const limit = formatBytes(MAX_BYTES, units);
          setAlert({
            title: t("errTooLarge", { name: f.name }),
            desc: t("errTooLargeDesc", { name: f.name, size, limit }),
            kind: "error",
          });
          toast(t("errTooLarge", { name: f.name }), "err");
        } else {
          setAlert({
            title: t("errNoFile"),
            desc: t("errNoFileDesc"),
            kind: "warn",
          });
          toast(t("errNoFile"), "err");
        }
        return;
      }

      setAlert(null);
      setBadge("busy");

      const settled = await Promise.all(
        accepted.map((f) =>
          convertFile(f)
            .then((rec) => ({ ok: true as const, rec, file: f }))
            .catch(() => ({ ok: false as const, file: f }))
        )
      );

      const succeeded: Rec[] = [];
      const failed: File[] = [];
      for (const s of settled) {
        if (s.ok) succeeded.push(s.rec);
        else failed.push(s.file);
      }

      if (failed.length) {
        const f = failed[0];
        setAlert({
          title: t("errRead", { name: f.name }),
          desc: t("errReadDesc", { name: f.name }),
          kind: "error",
        });
        toast(t("errRead", { name: f.name }), "err");
      }

      if (succeeded.length) {
        // Newest first — the last file in the batch becomes the previewed one.
        const incoming = [...succeeded].reverse();
        setRecords((prev) => [...incoming, ...prev].slice(0, MAX_RECORDS));
        setActiveId(incoming[0].id);
        setBadge("done");
      } else {
        setBadge("error");
      }

      const skipped = rejectedType.length + rejectedSize.length;
      if (skipped > 0) {
        toast(t("okSkipped", { n: succeeded.length, m: skipped }), "info");
      } else if (succeeded.length) {
        toast(t("okAdded", { n: succeeded.length }), "ok");
      }

      // A partial size rejection still deserves the explicit notice.
      if (rejectedSize.length) {
        const f = rejectedSize[0];
        const size = formatBytes(f.size, units);
        const limit = formatBytes(MAX_BYTES, units);
        setAlert({
          title: t("errTooLarge", { name: f.name }),
          desc: t("errTooLargeDesc", { name: f.name, size, limit }),
          kind: "error",
        });
      } else if (rejectedType.length) {
        const name = rejectedType[0].name;
        setAlert({
          title: t("errNotImage", { name }),
          desc: t("errNotImageDesc", { name }),
          kind: "error",
        });
      }
    },
    [t, toast, units]
  );

  /* ---------------- URL loading ---------------- */

  const loadUrl = useCallback(
    async (raw?: string) => {
      const value = raw ?? urlValue;
      if (loadingUrl) return;

      if (!String(value || "").trim()) {
        setAlert({ title: t("errUrlEmpty"), desc: t("errUrlEmptyDesc"), kind: "warn" });
        toast(t("errUrlEmpty"), "err");
        return;
      }

      setLoadingUrl(true);
      setAlert(null);

      const result = await loadRemoteImage(value);

      if (result.ok) {
        setUrlInvalid(false);
        const rec = result.rec;
        setRecords((prev) => [rec, ...prev].slice(0, MAX_RECORDS));
        setActiveId(rec.id);
        setBadge("done");
        toast(t("okLoaded"), "ok");
      } else {
        if (result.error.code === "invalid" || result.error.code === "empty") {
          setUrlInvalid(true);
        }
        const { title, desc } = loadErrorText(result.error);
        setAlert({ title, desc, kind: "error" });
        toast(title, "err");
      }

      setLoadingUrl(false);
    },
    [urlValue, loadingUrl, loadErrorText, t, toast]
  );

  /* ---------------- clipboard ---------------- */

  const currentText = useCallback(() => {
    if (!active) return "";
    return mode === "uri" ? active.dataUri : active.rawBase64;
  }, [active, mode]);

  const copy = useCallback(
    async (text?: string, rec?: Rec) => {
      const target = text ?? (rec ? (mode === "uri" ? rec.dataUri : rec.rawBase64) : currentText());
      if (!target) return;
      const label = mode === "uri" ? t("labelUri") : t("labelRaw");
      const outcome = await copyText(target);

      if (outcome === "copied") {
        toast(t("okCopy", { label }), "ok");
        setCopied(true);
        window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
      } else {
        // Every clipboard route was blocked. The text has been selected in
        // the document, so say exactly that instead of a bare "failed".
        setAlert({
          title: t("errCopy"),
          desc: `${t("errCopyDesc")} ${t("errCopyFallbackDesc")}`,
          kind: "error",
        });
        toast(t("errCopy"), "err");
      }
    },
    [active, mode, currentText, t, toast]
  );

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  /* ---------------- download ---------------- */

  const download = useCallback(
    (rec?: Rec) => {
      const target = rec ?? active;
      if (!target) return;
      const text = mode === "uri" ? target.dataUri : target.rawBase64;
      const name = downloadText(
        text,
        cleanFileName(target.name),
        mode === "uri" ? "datauri" : "base64"
      );
      toast(t("okDownload", { name }), "ok");
    },
    [active, mode, t, toast]
  );

  /* ---------------- list operations ---------------- */

  const remove = useCallback(
    (id: string) => {
      // Counted outside the updater so StrictMode's double invocation
      // cannot run the toasts twice or mis-set the active record.
      const next = records.filter((r) => r.id !== id);
      setRecords(next);

      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
        setBadge(next.length ? "done" : "idle");
      }

      toast(t("okRemoved"), "info");
    },
    [records, activeId, t, toast]
  );

  const clearAll = useCallback(() => {
    if (!records.length) {
      toast(t("listEmpty"), "info");
      return;
    }
    setRecords([]);
    setActiveId(null);
    setBadge("idle");
    setAlert(null);
    toast(t("okCleared"), "ok");
  }, [records, t, toast]);

  /* ---------------- global drag & drop + paste ----------------
     Registered once. The handlers are read through refs so that typing in
     the URL field (which changes `loadUrl`'s identity) does not tear down
     and re-attach document-level listeners on every keystroke. */

  const ingestRef = useRef(ingest);
  const loadUrlRef = useRef(loadUrl);
  useEffect(() => {
    ingestRef.current = ingest;
  }, [ingest]);
  useEffect(() => {
    loadUrlRef.current = loadUrl;
  }, [loadUrl]);

  useEffect(() => {
    let depth = 0;

    const stop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const onEnterOver = (e: DragEvent) => {
      stop(e);
      const types = e.dataTransfer?.types;
      const hasFiles = types ? Array.prototype.indexOf.call(types, "Files") > -1 : false;
      if (hasFiles) {
        if (e.type === "dragenter") depth += 1;
        setDragActive(true);
      }
    };

    const onLeave = (e: DragEvent) => {
      stop(e);
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragActive(false);
    };

    const onDrop = (e: DragEvent) => {
      stop(e);
      depth = 0;
      setDragActive(false);
      const dt = e.dataTransfer;
      if (!dt) return;

      if (dt.files && dt.files.length) {
        void ingestRef.current(Array.from(dt.files));
        return;
      }

      // Dropping a link or an <img> element from another page.
      const html = dt.getData ? dt.getData("text/html") : "";
      const plain = dt.getData ? dt.getData("text/plain") : "";
      const match = /<img[^>]+src=["']([^"']+)["']/i.exec(html || "");
      if (match) {
        setUrlValue(match[1]);
        void loadUrlRef.current(match[1]);
        return;
      }
      if (plain && /^https?:\/\//i.test(plain.trim())) {
        const v = plain.trim();
        setUrlValue(v);
        void loadUrlRef.current(v);
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      const cd = e.clipboardData;
      if (!cd) return;
      const items = cd.items || [];
      const files: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === "file" && /^image\//i.test(it.type)) {
          let f = it.getAsFile();
          if (f) {
            if (!f.name || f.name === "image.png" || f.name === "blob") {
              const ext = MIME_EXT[f.type] || "png";
              f = new File(
                [f],
                `pasted-image${files.length ? `-${files.length + 1}` : ""}.${ext}`,
                { type: f.type }
              );
            }
            files.push(f);
          }
        }
      }

      if (!files.length && cd.files && cd.files.length) {
        for (const f of Array.from(cd.files)) {
          if (/^image\//i.test(f.type)) files.push(f);
        }
      }

      if (files.length) {
        e.preventDefault();
        void ingestRef.current(files);
        return;
      }

      // A bare image URL on the clipboard.
      const text = (cd.getData ? cd.getData("text/plain") : "").trim();
      const focused = document.activeElement;
      const inUrlField = focused instanceof HTMLInputElement;
      if (text && /^https?:\/\/\S+$/i.test(text) && !inUrlField) {
        setUrlValue(text);
        void loadUrlRef.current(text);
      }
    };

    document.addEventListener("dragenter", onEnterOver);
    document.addEventListener("dragover", onEnterOver);
    document.addEventListener("dragleave", onLeave);
    document.addEventListener("drop", onDrop);
    document.addEventListener("paste", onPaste);

    return () => {
      document.removeEventListener("dragenter", onEnterOver);
      document.removeEventListener("dragover", onEnterOver);
      document.removeEventListener("dragleave", onLeave);
      document.removeEventListener("drop", onDrop);
      document.removeEventListener("paste", onPaste);
    };
  }, []);

  /* ---------------- derived ---------------- */

  const downloadExt = active
    ? active.source === "url"
      ? "png"
      : MIME_EXT[active.mime] || "png"
    : "png";

  return {
    d,
    t,
    units,
    // state
    records,
    active,
    mode,
    badge,
    alert,
    toasts,
    dragActive,
    urlValue,
    urlInvalid,
    loadingUrl,
    copied,
    downloadExt,
    // actions
    setMode,
    setUrlValue,
    setUrlInvalid,
    setAlert,
    ingest,
    loadUrl,
    copy,
    download,
    remove,
    clearAll,
    toast,
    formatBytes: (n: number) => formatBytes(n, units),
  };
}

export type ConverterApi = ReturnType<typeof useConverter>;
