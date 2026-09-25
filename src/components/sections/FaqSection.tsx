import { Code } from "../Markup";
import { Section } from "./Section";
import { FAQ } from "@/lib/faq";
import type { Lang } from "@/lib/site";

export function FaqSection({ lang, heading }: { lang: Lang; heading: string }) {
  return (
    <Section id="faq" alt>
      <h2>{heading}</h2>
      <div className="faq">
        {FAQ[lang].map((f, i) => (
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
