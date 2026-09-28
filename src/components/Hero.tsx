import { Fragment } from "react";
import { dict, type Dict } from "@/lib/dict";
import {
  HTML_LANG,
  LANG_NAMES,
  otherLangs,
  pagePath,
  type Lang,
  type Page,
} from "@/lib/site";

/**
 * Hero copy keys per tool.
 *
 * Each direction has its own H1 and subtitle, because they are two
 * separate query clusters and the H1 is where each page carries its
 * primary target query. Looked up rather than branched: a ternary chain
 * would silently fall through to the other tool's headline if a page
 * were ever added.
 */
const HERO_KEYS: Record<
  Page,
  { title: keyof Dict; subtitle: keyof Dict; ctaPrimary: keyof Dict; ctaSecondary: keyof Dict }
> = {
  encode: {
    title: "heroTitle",
    subtitle: "heroSubtitle",
    ctaPrimary: "heroCtaPrimary",
    ctaSecondary: "heroCtaSecondary",
  },
  decode: {
    title: "decHeroTitle",
    subtitle: "decHeroSubtitle",
    ctaPrimary: "decHeroCtaPrimary",
    ctaSecondary: "decHeroCtaSecondary",
  },
};

export function Hero({ lang, page }: { lang: Lang; page: Page }) {
  const d = dict[lang];
  const k = HERO_KEYS[page];

  return (
    <section className="hero">
      <div className="container">
        <h1>{d[k.title]}</h1>
        <p>{d[k.subtitle]}</p>
        <div className="hero__actions">
          {/* Real anchors, not buttons: they work without JS and they give
              crawlers an internal link to the tool and the format list. */}
          <a className="btn btn--primary" href="#tool">
            {d[k.ctaPrimary]}
          </a>
          <a className="btn btn--ghost" href="#formats">
            {d[k.ctaSecondary]}
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer({ lang, page }: { lang: Lang; page: Page }) {
  const d = dict[lang];
  // A second, plain-text route to every other language *of this page*.
  // The header switcher already does this, but a redundant followable
  // link in the footer costs nothing and survives a crawler that ignores
  // the nav. It targets pagePath(other, page) — the equivalent page, not
  // the language root.
  const others = otherLangs(lang);
  const otherPage: Page = page === "encode" ? "decode" : "encode";

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>{d.footerCopy}</span>
        <span>
          <a href="#privacy">{d.footerPrivacy}</a>
          &nbsp;·&nbsp;
          <a href="#formats">{d.footerFormats}</a>
          &nbsp;·&nbsp;
          {/* The cross-tool link. One followable hop between the two
              clusters, in both directions, without a single JS handler. */}
          <a href={pagePath(lang, otherPage)}>
            {otherPage === "encode" ? d.toolEncode : d.toolDecode}
          </a>
          {/* Same names as the header menu, written in their own
              language, so the two switchers can never disagree. */}
          {others.map((l) => (
            <Fragment key={l}>
              &nbsp;·&nbsp;
              <a href={pagePath(l, page)} hrefLang={HTML_LANG[l]} lang={HTML_LANG[l]}>
                {LANG_NAMES[l]}
              </a>
            </Fragment>
          ))}
        </span>
      </div>
    </footer>
  );
}
