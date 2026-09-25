"use client";

import { useRef } from "react";
import { AlertIcon, ImagePlaceholderIcon } from "./Icons";
import type { ConverterApi } from "./useConverter";

export function UploadCard({ api }: { api: ConverterApi }) {
  const { t, records, dragActive, alert, urlValue, urlInvalid, loadingUrl, ingest } = api;
  const fileInput = useRef<HTMLInputElement>(null);

  const openPicker = () => fileInput.current?.click();

  const count = records.length
    ? t("uploadCount", { n: records.length })
    : t("uploadCountZero");

  return (
    <section className="card" id="upload">
      <div className="card__head">
        <h2 className="card__title">{t("uploadTitle")}</h2>
        <span className="card__meta">{count}</span>
      </div>

      <div
        className={`dropzone${dragActive ? " is-dragover" : ""}`}
        id="dropzone"
        role="button"
        tabIndex={0}
        aria-describedby="dropHint"
        aria-label={t("dropzoneAriaDesc")}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            openPicker();
          }
        }}
      >
        <div className="dropzone__icon">
          <ImagePlaceholderIcon />
        </div>
        <div className="dropzone__title">
          {dragActive ? t("dropTitleActive") : t("dropTitle")}
        </div>
        <div className="dropzone__hint" id="dropHint">
          {t("dropHint")}
        </div>
        <button
          type="button"
          className="btn btn--primary btn--sm dropzone__cta"
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
          }}
        >
          {t("pickButton")}
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*,.svg"
        multiple
        hidden
        aria-label={t("pickButton")}
        onChange={(e) => {
          if (e.target.files?.length) void ingest(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      {/* Keyword-carrying field label: "Convert image URL to base64" / "图片 URL 转 Base64" */}
      <label className="field-label" htmlFor="urlInput">
        {t("urlLabel")}
      </label>
      <div className="urlrow">
        <input
          type="url"
          className={`input${urlInvalid ? " input--invalid" : ""}`}
          id="urlInput"
          value={urlValue}
          placeholder={t("urlPlaceholder")}
          onChange={(e) => {
            api.setUrlValue(e.target.value);
            api.setUrlInvalid(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void api.loadUrl();
            }
          }}
        />
        <button
          type="button"
          className="btn btn--dark"
          disabled={loadingUrl}
          onClick={() => void api.loadUrl()}
        >
          {loadingUrl ? t("loadingButton") : t("loadButton")}
        </button>
      </div>
      <p className="url-note">{t("urlNote")}</p>

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
