import type { Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { Shell } from "@/components/Shell";

/**
 * Root layout for the Chinese version.
 *
 * Page metadata lives in each page.tsx rather than here: this group
 * serves two pages now, and a layout-level title/canonical would be
 * inherited by both — the encoder's canonical URL on the decoder's page.
 * The layout's job is the document shell, so <html lang> stays a
 * build-time attribute.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function ZhLayout({ children }: { children: ReactNode }) {
  return <Shell lang="zh">{children}</Shell>;
}
