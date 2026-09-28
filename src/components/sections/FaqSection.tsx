import { Code } from "../Markup";
import { Section } from "./Section";
import { FAQ } from "@/lib/faq";
import { dict } from "@/lib/dict";
import type { Lang, Page } from "@/lib/site";

/**
 * The FAQ heading comes from the dictionary; the questions come from the
 * page's own list in lib/faq.ts. Both are needed per page: the two tools
 * answer different questions, and the same FAQPage payload on two URLs
 * tells a crawler the pages are duplicates.
 */
export function FaqSection({ lang, page }: { lang: Lang; page: Page }) {
  const d = dict[lang];
  const heading = page === "encode" ? d.faqHeading : d.decFaqHeading;

  return (
    <Section id="faq" alt>
      <h2>{heading}</h2>
      <div className="faq">
        {FAQ[page][lang].map((f, i) => (
          <details className="faq__item" key={f.q} open={i === 0}>
            <summary>{f.q}</summary>
            <div className="faq__a">
              <p>
                <Code text={f.a} />
              </p>
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}
