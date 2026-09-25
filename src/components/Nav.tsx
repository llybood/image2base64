import { dict } from "@/lib/dict";
import { BRAND, HTML_LANG, PATHS, type Lang } from "@/lib/site";
import { BrandMark } from "./tool/Icons";

/**
 * The language switcher is built from real <a href> links, not buttons.
 * That matters for two reasons: the rendered language always matches the
 * URL that canonical + hreflang advertise, and crawlers get a followable
 * link from "/" to "/en/" and back.
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
          <a
            className="lang__btn"
            href={PATHS.zh}
            hrefLang={HTML_LANG.zh}
            aria-current={lang === "zh" ? "true" : undefined}
          >
            {d.langZh}
          </a>
          <a
            className="lang__btn"
            href={PATHS.en}
            hrefLang={HTML_LANG.en}
            aria-current={lang === "en" ? "true" : undefined}
          >
            {d.langEn}
          </a>
        </nav>
      </div>
    </header>
  );
}
