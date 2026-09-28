import type { Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { Shell } from "@/components/Shell";

/**
 * Root layout for the English version.
 *
 * English is the default language, so the encoder owns the site root and
 * is the target of the hreflang "x-default" annotation — but that is a
 * *page* fact, not a layout fact. This group now serves two pages, so
 * each one declares its own metadata (title, description, canonical,
 * hreflang, Open Graph) in its own page.tsx. Keeping buildMetadata here
 * would have had both pages inherit the encoder's title and, far worse,
 * its canonical URL.
 *
 * What genuinely belongs to the layout is the document shell: <html lang>
 * is fixed per route group, so it is a real build-time attribute rather
 * than something JavaScript rewrites after hydration. The (zh) and (de)
 * groups supply their own root layouts for the same reason.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function EnLayout({ children }: { children: ReactNode }) {
  return <Shell lang="en">{children}</Shell>;
}
