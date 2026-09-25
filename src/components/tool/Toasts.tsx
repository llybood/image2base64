import type { ReactNode } from "react";
import { ToastErrIcon, ToastInfoIcon, ToastOkIcon } from "./Icons";
import type { ToastKind } from "./useConverter";

const ICON: Record<ToastKind, ReactNode> = {
  ok: <ToastOkIcon />,
  err: <ToastErrIcon />,
  info: <ToastInfoIcon />,
};

export function Toasts({
  items,
}: {
  items: { id: number; text: string; kind: ToastKind; leaving?: boolean }[];
}) {
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast${t.leaving ? " toast--out" : ""}`}
          role={t.kind === "err" ? "alert" : "status"}
        >
          {ICON[t.kind]}
          <span className="toast__text">{t.text}</span>
        </div>
      ))}
    </div>
  );
}
