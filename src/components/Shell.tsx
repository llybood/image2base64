import type { ReactNode } from "react";
import { dict } from "@/lib/dict";
import { HTML_LANG, type Lang } from "@/lib/site";

/**
 * The document shell. Each language version is its own root layout
 * (via the (zh) / (en) route groups) so `<html lang>` is a real,
 * build-time attribute rather than something JavaScript rewrites after
 * hydration. Search engines read the served HTML, not the hydrated DOM.
 */
export function Shell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const d = dict[lang];

  return (
    <html lang={HTML_LANG[lang]} data-lang={lang}>
      <body>
        <noscript>
          <div className="noscript-note">
            <b>{d.noscriptTitle}</b>
            {d.noscriptBody}
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
