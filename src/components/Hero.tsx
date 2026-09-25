import { Fragment } from "react";
import { dict } from "@/lib/dict";
import { HTML_LANG, LANGS, LANG_LABELS, PATHS, type Lang } from "@/lib/site";

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
  // A second, plain-text route to every other language. The header
  // switcher already does this, but a redundant followable link in the
  // footer costs nothing and survives a crawler that ignores the nav.
  const others = LANGS.filter((l) => l !== lang);

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>{d.footerCopy}</span>
        <span>
          <a href="#privacy">{d.footerPrivacy}</a>
          &nbsp;·&nbsp;
          <a href="#formats">{d.footerFormats}</a>
          {others.map((l) => (
            <Fragment key={l}>
              &nbsp;·&nbsp;
              <a href={PATHS[l]} hrefLang={HTML_LANG[l]}>
                {LANG_LABELS[l]}
              </a>
            </Fragment>
          ))}
        </span>
      </div>
    </footer>
  );
}
