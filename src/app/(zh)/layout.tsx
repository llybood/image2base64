import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { Shell } from "@/components/Shell";
import { buildMetadata } from "@/lib/site";

/**
 * Root layout for the Chinese version, served at "/zh/".
 * The (en) route group supplies its own root layout for the site root, so
 * each language ships its own <html lang> instead of patching it at
 * runtime.
 */
export const metadata: Metadata = buildMetadata("zh");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function ZhLayout({ children }: { children: ReactNode }) {
  return <Shell lang="zh">{children}</Shell>;
}
