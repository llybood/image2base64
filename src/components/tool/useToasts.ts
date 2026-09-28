"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Toast queue, shared by both tools.
 *
 * Extracted rather than duplicated: a second copy would be a second place
 * for the exit animation timing to be edited, and the two tools' toasts
 * would slowly stop behaving the same way.
 */

export type ToastKind = "ok" | "err" | "info";
export type Toast = { id: number; text: string; kind: ToastKind; leaving?: boolean };

const TOAST_LIMIT = 4;
const TOAST_TTL = 3200;
/** How long before removal the exit animation starts. Must stay shorter
    than the CSS animation, or the element unmounts mid-transition. */
const TOAST_OUT = 220;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const toast = useCallback((text: string, kind: ToastKind = "info") => {
    if (!text) return;
    const id = ++seq.current;
    setToasts((prev) => [...prev, { id, text, kind }].slice(-TOAST_LIMIT));
    // Two-phase removal so the exit animation actually plays before unmount.
    window.setTimeout(() => {
      setToasts((prev) => prev.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    }, TOAST_TTL - TOAST_OUT);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, TOAST_TTL);
  }, []);

  return { toasts, toast };
}
