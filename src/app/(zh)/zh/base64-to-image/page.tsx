import { Footer, Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Decoder } from "@/components/tool/Decoder";
import { FaqSection } from "@/components/sections/FaqSection";
import { GuideZhDecode } from "@/components/sections/GuideZhDecode";
import { buildMetadata } from "@/lib/site";

/** Metadata is declared per page, never on the group layout — that
    layout also serves the encoder and would give both the same canonical
    URL. See the note in src/app/(en)/page.tsx. */
export const metadata = buildMetadata("zh", "decode");

export default function Page() {
  return (
    <>
      <Nav lang="zh" page="decode" />
      <Hero lang="zh" page="decode" />
      <Decoder lang="zh" />
      <GuideZhDecode />
      <FaqSection lang="zh" page="decode" />
      <Footer lang="zh" page="decode" />
      <JsonLd lang="zh" page="decode" />
    </>
  );
}
