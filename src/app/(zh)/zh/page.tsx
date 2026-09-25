import { Footer, Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Workspace } from "@/components/Workspace";
import { FaqSection } from "@/components/sections/FaqSection";
import { GuideZh } from "@/components/sections/GuideZh";

export default function Page() {
  return (
    <>
      <Nav lang="zh" />
      <Hero lang="zh" />
      <Workspace lang="zh" />
      <GuideZh />
      <FaqSection lang="zh" heading="常见问题" />
      <Footer lang="zh" />
      <JsonLd lang="zh" />
    </>
  );
}
