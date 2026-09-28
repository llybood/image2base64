import { Footer, Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Workspace } from "@/components/Workspace";
import { FaqSection } from "@/components/sections/FaqSection";
import { GuideZh } from "@/components/sections/GuideZh";
import { buildMetadata } from "@/lib/site";

/** Metadata is declared per page, never on the group layout — that
    layout serves both tools and would give them the same canonical URL.
    See the note in src/app/(en)/page.tsx. */
export const metadata = buildMetadata("zh", "encode");

export default function Page() {
  return (
    <>
      <Nav lang="zh" page="encode" />
      <Hero lang="zh" page="encode" />
      <Workspace lang="zh" />
      <GuideZh />
      <FaqSection lang="zh" page="encode" />
      <Footer lang="zh" page="encode" />
      <JsonLd lang="zh" page="encode" />
    </>
  );
}
