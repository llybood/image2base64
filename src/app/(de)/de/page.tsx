import { Footer, Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Workspace } from "@/components/Workspace";
import { FaqSection } from "@/components/sections/FaqSection";
import { GuideDe } from "@/components/sections/GuideDe";

export default function Page() {
  return (
    <>
      <Nav lang="de" />
      <Hero lang="de" />
      <Workspace lang="de" />
      <GuideDe />
      <FaqSection lang="de" heading="Häufige Fragen" />
      <Footer lang="de" />
      <JsonLd lang="de" />
    </>
  );
}
