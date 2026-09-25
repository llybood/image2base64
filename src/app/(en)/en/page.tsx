import { Footer, Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Workspace } from "@/components/Workspace";
import { FaqSection } from "@/components/sections/FaqSection";
import { GuideEn } from "@/components/sections/GuideEn";

export default function Page() {
  return (
    <>
      <Nav lang="en" />
      <Hero lang="en" />
      <Workspace lang="en" />
      <GuideEn />
      <FaqSection lang="en" heading="Frequently asked questions" />
      <Footer lang="en" />
      <JsonLd lang="en" />
    </>
  );
}
