import { Footer, Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Workspace } from "@/components/Workspace";
import { FaqSection } from "@/components/sections/FaqSection";
import { GuideDe } from "@/components/sections/GuideDe";
import { buildMetadata } from "@/lib/site";

/** Metadata is declared per page, never on the group layout — that
    layout serves both tools and would give them the same canonical URL.
    See the note in src/app/(en)/page.tsx. */
export const metadata = buildMetadata("de", "encode");

export default function Page() {
  return (
    <>
      <Nav lang="de" page="encode" />
      <Hero lang="de" page="encode" />
      <Workspace lang="de" />
      <GuideDe />
      <FaqSection lang="de" page="encode" />
      <Footer lang="de" page="encode" />
      <JsonLd lang="de" page="encode" />
    </>
  );
}
