"use client";

import { formatInt } from "@/lib/convert";
import { CopyIcon, DownloadIcon, ThumbMark } from "./Icons";
import type { Badge, DecoderApi } from "./useDecoder";

const BADGE_CLASS: Record<Badge, string> = {
  idle: "badge",
  busy: "badge badge--busy",
  done: "badge badge--ok",
  error: "badge badge--err",
};

export function DecodedCard({ api }: { api: DecoderApi }) {
  const { t, decoded, badge, copied, download, copyUri } = api;

  const badgeLabel =
    badge === "done"
      ? t("decBadgeDone")
      : badge === "error"
        ? t("decBadgeError")
        : badge === "busy"
          ? t("decBadgeBusy")
          : t("decBadgeIdle");

  // How much smaller the image is than the string that carried it. Base64
  // spends 4 characters per 3 bytes, so the honest answer sits near 25%
  // and the number is a real measurement, not an estimate.
  const saving =
    decoded && decoded.inputChars > 0
      ? (1 - decoded.byteLength / decoded.inputChars) * 100
      : 0;

  return (
    <section className="card" id="result">
      <div className="card__head">
        <h2 className="card__title">{t("decResultTitle")}</h2>
        <span className={BADGE_CLASS[badge]}>
          <span>{badgeLabel}</span>
        </span>
      </div>

      {decoded ? (
        <>
          <div className="preview">
            {decoded.renderable ? (
              <img src={decoded.previewUrl} alt={t("decPreviewAlt")} />
            ) : (
              /* The bytes are a real image — the sniff said so — but this
                 browser will not paint them. Say that plainly instead of
                 showing a broken-image icon. */
              <div className="preview__unavailable">
                <ThumbMark />
                <span>{t("decPreviewUnavailable")}</span>
              </div>
            )}
          </div>

          <div className="metastrip">
            <div className="metastrip__name">
              <b>{decoded.name}</b>
              <span>{decoded.extLabel}</span>
            </div>
            <div className="stat">
              <span className="stat__k">{t("decStatSize")}</span>
              <span className="stat__v stat__v--accent">
                {api.formatBytes(decoded.byteLength)}
              </span>
            </div>
            <div className="stat">
              <span className="stat__k">{t("decStatSaving")}</span>
              <span className="stat__v">-{saving.toFixed(1)}%</span>
            </div>
            <div className="stat">
              <span className="stat__k">{t("decStatDimensions")}</span>
              <span className="stat__v">
                {decoded.width && decoded.height
                  ? `${formatInt(decoded.width)} × ${formatInt(decoded.height)}`
                  : "—"}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="preview preview--empty">
          <div className="preview__unavailable">
            <ThumbMark />
            <span>{t("decBadgeIdle")}</span>
          </div>
        </div>
      )}

      <div className="result__actions result__actions--end">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={!decoded}
          onClick={() => download()}
        >
          <DownloadIcon />
          <span>{t("decDownloadButton", { ext: decoded?.ext ?? "png" })}</span>
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={!decoded || copied}
          onClick={() => void copyUri()}
        >
          <CopyIcon />
          <span>{copied ? t("copiedButton") : t("decCopyButton")}</span>
        </button>
      </div>

      <p className="result__note result__note--block">{t("decResultNote")}</p>
    </section>
  );
}
