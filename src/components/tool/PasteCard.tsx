"use client";

import { formatInt } from "@/lib/convert";
import { AlertIcon, DecodeMarkIcon, PasteIcon } from "./Icons";
import type { DecoderApi } from "./useDecoder";

/**
 * The input card — the mirror of `UploadCard`, with a textarea where the
 * dropzone was.
 *
 * The textarea is controlled rather than uncontrolled: the "Paste from
 * clipboard" button and the document-level paste handler both have to
 * write into it. The debounce lives in the hook, so the field itself
 * stays instantaneous no matter how long the string is.
 */
export function PasteCard({ api }: { api: DecoderApi }) {
  const { t, input, fieldRef, alert, hasInput, detected, decoded } = api;

  /** The payload's length once known, the raw length before that — the
      header should not count whitespace that will be stripped anyway. */
  const chars = decoded?.inputChars ?? input.trim().length;

  /** Line under the field: the prefix claim, the measured format, or the
      resting prompt. A mismatch replaces both, since it is the one thing
      the user actually needs to notice. */
  const statusLine = detected.mismatch ?? detected.detail ?? detected.pending;

  return (
    <section className="card" id="paste">
      <div className="card__head">
        <h2 className="card__title">{t("decInputTitle")}</h2>
        <span className="card__meta">{chars ? t("charCount", { n: formatInt(chars) }) : ""}</span>
      </div>

      {/* A resting illustration, shown only while the field is empty. It
          explains which direction this page runs to someone who landed
          here without reading the H1. */}
      {!hasInput && (
        <div className="blankstate" aria-hidden="true">
          <DecodeMarkIcon />
        </div>
      )}

      <label className="field-label" htmlFor="b64Input">
        {t("decInputLabel")}
      </label>
      <textarea
        id="b64Input"
        ref={fieldRef}
        className="textarea"
        value={input}
        placeholder={t("decPlaceholder")}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-describedby="b64Note"
        onChange={(e) => api.setInput(e.target.value)}
      />

      <div className="pasterow">
        <button type="button" className="btn btn--dark" onClick={() => void api.pasteFrom()}>
          <PasteIcon />
          <span>{t("decPasteButton")}</span>
        </button>
        <button
          type="button"
          className="btn btn--pearl btn--sm"
          disabled={!hasInput}
          onClick={api.clear}
        >
          {t("decClearButton")}
        </button>
      </div>

      <p className="url-note" id="b64Note">
        {t("decInputNote")}
      </p>

      <div className="detected">
        <span className="detected__k">{t("decDetectedLabel")}</span>
        <span
          className={`detected__v${detected.mismatch ? " detected__v--warn" : ""}${
            statusLine ? "" : " detected__v--idle"
          }`}
        >
          {statusLine ?? t("decDetectedEmpty")}
        </span>
      </div>

      {alert && (
        <div className={`alert alert--${alert.kind}`} role="alert">
          <span className="alert__icon" aria-hidden="true">
            <AlertIcon />
          </span>
          <div className="alert__body">
            <div className="alert__title">{alert.title}</div>
            <div className="alert__desc">{alert.desc}</div>
          </div>
          <button
            type="button"
            className="alert__close"
            aria-label={t("alertCloseLabel")}
            onClick={() => api.setAlert(null)}
          >
            &times;
          </button>
        </div>
      )}
    </section>
  );
}
