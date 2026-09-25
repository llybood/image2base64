import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { Shell } from "@/components/Shell";
import { buildMetadata } from "@/lib/site";

/**
 * Root layout for the English version, served at "/en/".
 * This is the page the five target queries are aimed at, so its
 * title, description and H1 all carry them explicitly.
 */
export const metadata: Metadata = buildMetadata("en");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function EnLayout({ children }: { children: ReactNode }) {
  return <Shell lang="en">{children}</Shell>;
}
