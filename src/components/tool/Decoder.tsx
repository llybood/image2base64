"use client";

import { DecodedCard } from "./DecodedCard";
import { DecodeSideColumn } from "./DecodeSideColumn";
import { PasteCard } from "./PasteCard";
import { Toasts } from "./Toasts";
import { useDecoder } from "./useDecoder";
import type { Lang } from "@/lib/site";

/**
 * The reverse tool's client boundary — the counterpart of `Workspace`.
 *
 * A separate component rather than a mode inside `Workspace` on purpose:
 * the two tools share no state, and mounting both hooks on one page would
 * register two document-level paste listeners fighting over the same
 * event. Each page loads exactly one of them.
 */
export function Decoder({ lang }: { lang: Lang }) {
  const api = useDecoder(lang);

  return (
    <>
      <main className="workspace" id="tool">
        <div className="container workspace__grid">
          <div className="col">
            <PasteCard api={api} />
            <DecodedCard api={api} />
          </div>
          <DecodeSideColumn api={api} />
        </div>
      </main>
      <Toasts items={api.toasts} />
    </>
  );
}
