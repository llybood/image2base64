import { dict } from "@/lib/dict";
import { BRAND, PAGES, pagePath, type Lang, type Page } from "@/lib/site";
import { LangMenu } from "./LangMenu";
import { BrandMark } from "./tool/Icons";

/**
 * One row: the wordmark, then the two tools, then the language menu.
 *
 * The two clusters answer two different questions and move along two
 * different axes of the route model:
 *
 *   - the tool tabs switch between the two tools, staying in the current
 *     language;
 *   - the language menu switches language, staying on the current tool.
 *
 * Both are built from real <a href> links rather than buttons. That
 * matters for two reasons: the rendered language always matches the URL
 * that canonical + hreflang advertise, and crawlers get followable links
 * along both dimensions instead of one.
 *
 * The row is allowed to wrap. It needs about 640px for the wordmark plus
 * two spelled-out tool labels plus the menu, so a phone gets two lines —
 * wordmark on the first, the cluster right-aligned on the second, which
 * reads as one deliberate block rather than as an overflow that was
 * tolerated. The alternative, shrinking the wordmark until it fits,
 * would undo the one thing this header is meant to state.
 */
export function Nav({ lang, page }: { lang: Lang; page: Page }) {
  const d = dict[lang];

  return (
    <header className="nav">
      <div className="container nav__inner">
        <a className="nav__brand" href={pagePath(lang, "encode")}>
          <BrandMark width={22} height={22} />
          <span>{BRAND}</span>
        </a>

        <div className="nav__right">
          <nav className="tools" aria-label={d.toolNavLabel}>
            {PAGES.map((p) => (
              <a
                key={p}
                className="tools__btn"
                href={pagePath(lang, p)}
                aria-current={p === page ? "true" : undefined}
              >
                {p === "encode" ? d.toolEncode : d.toolDecode}
              </a>
            ))}
          </nav>

          <LangMenu lang={lang} page={page} label={d.langMenuLabel} />
        </div>
      </div>
    </header>
  );
}
