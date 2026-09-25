/**
 * Minimal inline-markup renderers.
 *
 * The UI dictionary keeps emphasis and code markers inline so translators
 * see the whole sentence in one piece. This turns those markers into real
 * elements without dangerouslySetInnerHTML.
 *
 * Deliberately not a client module: both server-rendered content sections
 * and client tool components use it.
 */

export function Bold({ text }: { text: string }) {
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^<b>(.*?)<\/b>$/.exec(p);
        return m ? <b key={i}>{m[1]}</b> : <span key={i}>{p}</span>;
      })}
    </>
  );
}

/** Renders `backticked` spans as inline <code>. */
export function Code({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^`([^`]+)`$/.exec(p);
        return m ? <code key={i}>{m[1]}</code> : <span key={i}>{p}</span>;
      })}
    </>
  );
}
