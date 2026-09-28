"use client";

import { Bold } from "../Markup";
import { PrivacyShieldIcon } from "./Icons";
import type { DecoderApi } from "./useDecoder";

/** Everything the decoder can identify from the bytes. AVIF is the one
    entry the forward tool does not offer, so the two lists are not the
    same and are deliberately not shared. */
const FORMATS = ["PNG", "JPG", "GIF", "WebP", "BMP", "SVG", "ICO", "AVIF"];

export function DecodeSideColumn({ api }: { api: DecoderApi }) {
  const { t, maxCharsLabel } = api;

  return (
    <aside className="col">
      <section className="card" id="formats">
        <h2 className="card__title card__title--sm" style={{ marginBottom: 14 }}>
          {t("decFormatsTitle")}
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
          {t("decLimitsTitle")}
        </h2>
        <ul className="bullets">
          <li>
            <span>
              {/* The character ceiling is derived from the byte ceiling in
                  decode.ts, so the number quoted here cannot drift from
                  the number actually enforced. */}
              <Bold text={t("decLimitSize", { limit: maxCharsLabel })} />
            </span>
          </li>
          <li>
            <span>{t("decLimitSniff")}</span>
          </li>
          <li>
            <span>{t("decLimitWhitespace")}</span>
          </li>
          <li>
            <span>{t("decLimitBlocked")}</span>
          </li>
        </ul>
      </section>

      <section className="privacy" id="privacy">
        <PrivacyShieldIcon />
        <div>
          <b>{t("decPrivacyTitle")}</b>
          <p>{t("decPrivacyDesc")}</p>
        </div>
      </section>
    </aside>
  );
}
