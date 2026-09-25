import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { Shell } from "@/components/Shell";
import { buildMetadata } from "@/lib/site";

/**
 * Root layout for the German version, served at "/de/".
 * A third sibling of the (en) and (zh) groups rather than a child of one
 * of them: each language owns its <html lang> as a build-time attribute,
 * so no group can be nested inside another and still declare a root.
 */
export const metadata: Metadata = buildMetadata("de");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function DeLayout({ children }: { children: ReactNode }) {
  return <Shell lang="de">{children}</Shell>;
}
