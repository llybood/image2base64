import { Footer, Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Decoder } from "@/components/tool/Decoder";
import { FaqSection } from "@/components/sections/FaqSection";
import { GuideDeDecode } from "@/components/sections/GuideDeDecode";
import { buildMetadata } from "@/lib/site";

/** Metadata is declared per page, never on the group layout — that
    layout also serves the encoder and would give both the same canonical
    URL. See the note in src/app/(en)/page.tsx. */
export const metadata = buildMetadata("de", "decode");

export default function Page() {
  return (
    <>
      <Nav lang="de" page="decode" />
      <Hero lang="de" page="decode" />
      <Decoder lang="de" />
      <GuideDeDecode />
      <FaqSection lang="de" page="decode" />
      <Footer lang="de" page="decode" />
      <JsonLd lang="de" page="decode" />
    </>
  );
}
