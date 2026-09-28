import { Footer, Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Workspace } from "@/components/Workspace";
import { FaqSection } from "@/components/sections/FaqSection";
import { GuideEn } from "@/components/sections/GuideEn";
import { buildMetadata } from "@/lib/site";

/**
 * Metadata lives on the page, not on the layout.
 *
 * Each language's route group holds *two* pages (encode + decode), so a
 * `metadata` export on the group's layout would be inherited by both and
 * both would emit the same canonical URL — telling a crawler that one of
 * the two pages does not exist. Declaring it per page keeps canonical,
 * title and the hreflang set correct for each.
 */
export const metadata = buildMetadata("en", "encode");

export default function Page() {
  return (
    <>
      <Nav lang="en" page="encode" />
      <Hero lang="en" page="encode" />
      <Workspace lang="en" />
      <GuideEn />
      <FaqSection lang="en" page="encode" />
      <Footer lang="en" page="encode" />
      <JsonLd lang="en" page="encode" />
    </>
  );
}
