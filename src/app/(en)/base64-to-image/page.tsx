import { Footer, Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Decoder } from "@/components/tool/Decoder";
import { FaqSection } from "@/components/sections/FaqSection";
import { GuideEnDecode } from "@/components/sections/GuideEnDecode";
import { buildMetadata } from "@/lib/site";

/** Metadata is declared per page, never on the group layout — that
    layout also serves the encoder and would give both the same canonical
    URL. See the note in src/app/(en)/page.tsx. */
export const metadata = buildMetadata("en", "decode");

export default function Page() {
  return (
    <>
      <Nav lang="en" page="decode" />
      <Hero lang="en" page="decode" />
      <Decoder lang="en" />
      <GuideEnDecode />
      <FaqSection lang="en" page="decode" />
      <Footer lang="en" page="decode" />
      <JsonLd lang="en" page="decode" />
    </>
  );
}
