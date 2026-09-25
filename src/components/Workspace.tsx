"use client";

import { ResultCard } from "./tool/ResultCard";
import { SideColumn } from "./tool/SideColumn";
import { Toasts } from "./tool/Toasts";
import { UploadCard } from "./tool/UploadCard";
import { useConverter } from "./tool/useConverter";
import type { Lang } from "@/lib/site";

/**
 * One client boundary wraps the whole tool. Everything inside is still
 * server-rendered to HTML at build time, so the labels, limits and
 * notices are present in the initial response for crawlers and for
 * users with a cold cache — only the interactivity ships as JS.
 */
export function Workspace({ lang }: { lang: Lang }) {
  const api = useConverter(lang);

  return (
    <>
      <main className="workspace" id="tool">
        <div className="container workspace__grid">
          <div className="col">
            <UploadCard api={api} />
            <ResultCard api={api} />
          </div>
          <SideColumn api={api} />
        </div>
      </main>
      <Toasts items={api.toasts} />
    </>
  );
}
