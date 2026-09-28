import type { Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { Shell } from "@/components/Shell";

/**
 * Root layout for the German version.
 * A third sibling of the (en) and (zh) groups rather than a child of one
 * of them: each language owns its <html lang> as a build-time attribute,
 * so no group can be nested inside another and still declare a root.
 *
 * Page metadata is declared by each page.tsx instead — this group serves
 * two pages, and a layout-level canonical would apply to both.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function DeLayout({ children }: { children: ReactNode }) {
  return <Shell lang="de">{children}</Shell>;
}
