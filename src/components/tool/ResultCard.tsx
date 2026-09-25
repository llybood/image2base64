"use client";

import { formatInt } from "@/lib/convert";
import { CopyIcon, DownloadIcon } from "./Icons";
import type { Badge, ConverterApi } from "./useConverter";

const BADGE_CLASS: Record<Badge, string> = {
  idle: "badge",
  busy: "badge badge--busy",
  done: "badge badge--ok",
  error: "badge badge--err",
};

export function ResultCard({ api }: { api: ConverterApi }) {
  const { t, active, mode, badge, copied, downloadExt, setMode, copy, download } = api;

  const text = active ? (mode === "uri" ? active.dataUri : active.rawBase64) : "";

  return (
    <section className="card" id="result">
      <div className="card__head">
        <h2 className="card__title">{t("resultTitle")}</h2>
        <span className={BADGE_CLASS[badge]}>
          <span>
            {badge === "idle"
              ? t("badgeIdle")
              : badge === "busy"
                ? t("badgeBusy")
                : badge === "done"
                  ? t("badgeDone")
                  : t("badgeError")}
          </span>
        </span>
      </div>

      {active && (
        <div className="metastrip">
          <div className="metastrip__thumb">
            <img src={active.previewUrl} alt="" />
          </div>
          <div className="metastrip__name">
            <b>{active.name}</b>
            <span>
              {active.width && active.height
                ? `${active.width} × ${active.height} px · ${active.ext}`
                : active.ext}
            </span>
          </div>
          <div className="stat">
            <span className="stat__k">{t("statOriginal")}</span>
            <span className="stat__v">{api.formatBytes(active.fileSize)}</span>
          </div>
          <div className="stat">
            <span className="stat__k">{t("statBase64")}</span>
            <span className="stat__v stat__v--accent">{api.formatBytes(active.textBytes)}</span>
          </div>
          <div className="stat">
            <span className="stat__k">{t("statIncrease")}</span>
            <span className="stat__v">
              {(active.increase >= 0 ? "+" : "") + active.increase.toFixed(1)}%
            </span>
          </div>
          <div className="stat">
            <span className="stat__k">{t("statFormat")}</span>
            <span className="stat__v">{active.ext}</span>
          </div>
        </div>
      )}

      <div className="tabs" role="tablist" aria-label={t("resultTitle")}>
        <button
          type="button"
          className="tab"
          role="tab"
          aria-selected={mode === "uri"}
          onClick={() => setMode("uri")}
        >
          {t("tabDataUri")}
        </button>
        <button
          type="button"
          className="tab"
          role="tab"
          aria-selected={mode === "raw"}
          onClick={() => setMode("raw")}
        >
          {t("tabRawBase64")}
        </button>
        <span className="tabs__spacer" />
        <span className="tabs__meta">
          {active ? t("charCount", { n: formatInt(text.length) }) : ""}
        </span>
      </div>

      <div className={`codebox${active ? "" : " codebox--empty"}`}>
        <pre id="codeText">{active ? text : t("codePlaceholder")}</pre>
      </div>

      <div className="result__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={!active || copied}
          onClick={() => void copy()}
        >
          <CopyIcon />
          <span>{copied ? t("copiedButton") : t("copyButton")}</span>
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={!active}
          onClick={() => download()}
        >
          <DownloadIcon />
          <span>{t("downloadFormat", { ext: downloadExt })}</span>
        </button>
        <span className="result__note">{t("resultNote")}</span>
      </div>
    </section>
  );
}
