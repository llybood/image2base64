"use client";

import { useEffect, useRef } from "react";
import { HTML_LANG, LANGS, LANG_NAMES, pagePath, type Lang, type Page } from "@/lib/site";
import { CheckIcon, ChevronDownIcon, GlobeIcon } from "./tool/Icons";

/**
 * The language switcher, collapsed into a disclosure.
 *
 * Three pills were the widest thing in the header and the first thing to
 * overflow a phone. A menu carries the same three destinations in one
 * control whose width does not change as languages are added.
 *
 * The entries are still real <a href> anchors, not a <select>. Two
 * reasons: the rendered language must always match the URL that
 * canonical and hreflang advertise, and a select would put navigation
 * behind JavaScript on a site whose language mechanism is deliberately
 * URL-only.
 *
 * <details>/<summary> supplies open, close, keyboard operation and the
 * expanded/collapsed state for screen readers from the browser. What it
 * does not supply is closing when the visitor clicks somewhere else —
 * that is the only thing the effect below adds.
 */
export function LangMenu({
  lang,
  page,
  label,
}: {
  lang: Lang;
  page: Page;
  label: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const close = () => el.removeAttribute("open");

    const onPointerDown = (e: PointerEvent) => {
      if (!el.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !el.open) return;
      close();
      el.querySelector<HTMLElement>("summary")?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    /* One details, one summary, no nested wrapper: the disclosure is the
       control. `aria-label` states the purpose rather than the content,
       because below 640px the word is dropped and only the globe is
       left — an icon-only trigger still has to announce itself. */
    <details className="langmenu" ref={ref}>
      <summary className="langmenu__btn" aria-label={label}>
        <GlobeIcon />
        <span className="langmenu__word">{label}</span>
        <ChevronDownIcon className="langmenu__chev" />
      </summary>

      <div className="langmenu__panel">
        {LANGS.map((l) => (
          <a
            key={l}
            className="langmenu__item"
            /* Follows the page, not the language root: on
               "/base64-to-image/" the German entry has to land on
               "/de/base64-to-image/". Sending it to "/de/" would drop
               the visitor into the other tool, and would advertise the
               wrong page as this one's German counterpart. */
            href={pagePath(l, page)}
            hrefLang={HTML_LANG[l]}
            /* So a screen reader pronounces "Deutsch" as German rather
               than in the language of the page it is being read from. */
            lang={HTML_LANG[l]}
            aria-current={l === lang ? "true" : undefined}
          >
            <span>{LANG_NAMES[l]}</span>
            <CheckIcon className="langmenu__check" />
          </a>
        ))}
      </div>
    </details>
  );
}
