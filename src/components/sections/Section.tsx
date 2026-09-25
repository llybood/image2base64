import type { ReactNode } from "react";

export function Section({
  id,
  alt,
  children,
}: {
  id: string;
  alt?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`section${alt ? " section--alt" : ""}`} id={id}>
      <div className="container">{children}</div>
    </section>
  );
}
