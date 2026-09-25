import { dict } from "@/lib/dict";
import { HTML_LANG, PATHS, type Lang } from "@/lib/site";

export function Hero({ lang }: { lang: Lang }) {
  const d = dict[lang];

  return (
    <section className="hero">
      <div className="container">
        <h1>{d.heroTitle}</h1>
        <p>{d.heroSubtitle}</p>
        <div className="hero__actions">
          {/* Real anchors, not buttons: they work without JS and they give
              crawlers an internal link to the tool and the format list. */}
          <a className="btn btn--primary" href="#tool">
            {d.heroCtaPrimary}
          </a>
          <a className="btn btn--ghost" href="#formats">
            {d.heroCtaSecondary}
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer({ lang }: { lang: Lang }) {
  const d = dict[lang];
  const other: Lang = lang === "zh" ? "en" : "zh";

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>{d.footerCopy}</span>
        <span>
          <a href="#privacy">{d.footerPrivacy}</a>
          &nbsp;·&nbsp;
          <a href="#formats">{d.footerFormats}</a>
          &nbsp;·&nbsp;
          <a href={PATHS[other]} hrefLang={HTML_LANG[other]}>
            {d.footerLang}
          </a>
        </span>
      </div>
    </footer>
  );
}
