import { dict } from "@/lib/dict";
import { BRAND, HTML_LANG, LANGS, LANG_LABELS, PATHS, type Lang } from "@/lib/site";
import { BrandMark } from "./tool/Icons";

/**
 * The language switcher is built from real <a href> links, not buttons.
 * That matters for two reasons: the rendered language always matches the
 * URL that canonical + hreflang advertise, and crawlers get a followable
 * link from every language page to every other one.
 *
 * The buttons are generated from LANGS rather than written out, so a new
 * language means one entry in src/lib/site.ts and no markup changes here.
 * Order is fixed — the default language first — rather than moving the
 * active language to the front, so the set does not reflow under the
 * pointer when the visitor switches.
 */
export function Nav({ lang }: { lang: Lang }) {
  const d = dict[lang];

  return (
    <header className="nav">
      <div className="container nav__inner">
        <a className="nav__brand" href={PATHS[lang]}>
          <BrandMark />
          <span>{BRAND}</span>
        </a>
        <div className="nav__spacer" />
        <nav className="lang" aria-label={d.langSwitchLabel}>
          {LANGS.map((l) => (
            <a
              key={l}
              className="lang__btn"
              href={PATHS[l]}
              hrefLang={HTML_LANG[l]}
              aria-current={l === lang ? "true" : undefined}
            >
              {LANG_LABELS[l]}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
