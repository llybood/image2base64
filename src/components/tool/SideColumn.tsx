"use client";

import { Bold } from "../Markup";
import { PrivacyShieldIcon, RemoveIcon, ThumbMark } from "./Icons";
import type { ConverterApi } from "./useConverter";

const FORMATS = ["JPG", "JPEG", "PNG", "GIF", "WebP", "BMP", "SVG", "ICO"];

export function SideColumn({ api }: { api: ConverterApi }) {
  const { t, records, mode, remove, clearAll, copy, download } = api;

  return (
    <aside className="col">
      <section className="card" id="formats">
        <h2 className="card__title card__title--sm" style={{ marginBottom: 14 }}>
          {t("formatsTitle")}
        </h2>
        <div className="chips">
          {FORMATS.map((f) => (
            <span className="chip" key={f}>
              {f}
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card__title card__title--sm" style={{ marginBottom: 14 }}>
          {t("limitsTitle")}
        </h2>
        <ul className="bullets">
          <li>
            <span>
              <Bold text={t("limitSingle")} />
            </span>
          </li>
          <li>
            <span>{t("limitBatch")}</span>
          </li>
          <li>
            <span>{t("limitCors")}</span>
          </li>
          <li>
            <span>{t("limitBlocked")}</span>
          </li>
        </ul>
      </section>

      <section className="card">
        <div className="card__head" style={{ marginBottom: 12 }}>
          <h2 className="card__title card__title--sm">{t("listTitle")}</h2>
          <button type="button" className="linkish" onClick={clearAll}>
            {t("clearAll")}
          </button>
        </div>

        <div className="list">
          {records.map((r) => (
            <div className="item" key={r.id}>
              <div className="item__thumb">
                {r.previewUrl ? (
                  <img src={r.previewUrl} alt="" />
                ) : (
                  <ThumbMark style={{ color: "var(--primary)" }} />
                )}
              </div>
              <div className="item__meta">
                <div className="item__name" title={r.name}>
                  {r.name}
                </div>
                <div className="item__sub">
                  {api.formatBytes(r.fileSize)} → {api.formatBytes(r.textBytes)} · {r.ext}
                </div>
              </div>
              <div className="item__actions">
                <button
                  type="button"
                  className="btn btn--pearl"
                  title={t("rowCopy")}
                  aria-label={`${t("rowCopy")} ${r.name}`}
                  onClick={() =>
                    void copy(mode === "uri" ? r.dataUri : r.rawBase64, r)
                  }
                >
                  {t("rowCopy")}
                </button>
                <button
                  type="button"
                  className="btn btn--pearl"
                  title={t("rowDownload")}
                  aria-label={`${t("rowDownload")} ${r.name}`}
                  onClick={() => download(r)}
                >
                  {t("rowDownload")}
                </button>
                <button
                  type="button"
                  className="btn btn--pearl"
                  title={t("rowRemove")}
                  aria-label={`${t("rowRemove")} ${r.name}`}
                  onClick={() => remove(r.id)}
                >
                  <RemoveIcon />
                </button>
              </div>
            </div>
          ))}
        </div>

        {!records.length && <div className="empty">{t("listEmpty")}</div>}
      </section>

      <section className="privacy" id="privacy">
        <PrivacyShieldIcon />
        <div>
          <b>{t("privacyTitle")}</b>
          <p>{t("privacyDesc")}</p>
        </div>
      </section>
    </aside>
  );
}
