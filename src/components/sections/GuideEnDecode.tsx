import { Section } from "./Section";

/**
 * English long-form content for the reverse tool.
 *
 * Structurally the mirror of `GuideEn`, and for the same reason: each H2
 * answers one of the queries this page targets, and the body is what
 * actually earns the ranking. The prose is deliberately different from
 * the forward page's — this direction has its own subject matter, which
 * is the whole argument for it having its own page.
 */
export function GuideEnDecode() {
  return (
    <>
      <Section id="convert">
        <h2>Convert base64 to image in three ways</h2>
        <p className="section__lede">
          One field, three ways to fill it — and all three accept the same range of strings.
        </p>

        <div className="prose">
          <p>
            A base64 string reaches you in whatever shape the tool that produced it happened to use.
            It may be a bare payload from an API response, a full <code>data:image/png;base64,&hellip;</code>{" "}
            URI from a stylesheet, a quoted string copied out of a log line, or the URL-safe variant
            from a token. This decoder normalises all of them before it looks at a single byte, so
            the format of the string is never something you have to clean up by hand.
          </p>
        </div>

        <div className="cards3" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">Option 1</span>
            <h3>Paste from the clipboard</h3>
            <p>
              The button reads the clipboard directly. Useful when the string is longer than you
              want to scroll through, and when the source is an application that copies without
              letting you select.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Option 2</span>
            <h3>Ctrl+V anywhere</h3>
            <p>
              Press Ctrl+V (Cmd+V on macOS) with the page focused — you do not have to click into
              the field first. Pasting is the gesture this tool is built around, so it works from
              wherever the cursor happens to be.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Option 3</span>
            <h3>Type or drop it in</h3>
            <p>
              Editing happens live: the image appears and updates as the string changes. That makes
              the field usable for trimming a truncated paste down to the last valid character and
              watching it turn back into a picture.
            </p>
          </div>
        </div>

        <div className="note" style={{ marginTop: 32 }}>
          <p>
            <b>What counts as a valid string.</b> Line breaks and spaces are ignored, so a wrapped
            payload works as-is. The URL-safe alphabet (<code>-</code> and <code>_</code>) is
            translated. Missing <code>=</code> padding is restored. Surrounding quotes,{" "}
            <code>url(&hellip;)</code> wrappers and any <code>data:</code> prefix are stripped. Only
            characters that are genuinely not base64 survive to be reported as an error.
          </p>
        </div>
      </Section>

      <Section id="converter" alt>
        <h2>What a base64 to image converter should get right</h2>
        <p className="section__lede">
          Decoding is one function call. Knowing what the bytes <em>are</em> is the part that
          separates a working tool from a plausible one.
        </p>

        <div className="prose">
          <p>
            A raw base64 string carries no type information whatsoever. It is just a number in base
            64 — nothing in it says &ldquo;PNG&rdquo; or &ldquo;JPEG&rdquo;. The only hint is the{" "}
            <code>data:</code> prefix, and that is a label written by whatever produced the string,
            not a fact about the bytes. Labels get carried over from renamed files, pasted between
            formats, and hard-coded by some exporter that never actually checked.
          </p>
          <p>
            So this converter reads the bytes. It matches the first few bytes against the known
            signatures of every format it supports, and it treats the prefix as a claim to be
            cross-checked rather than a source of truth. When the two disagree, you are told which
            one won — because a file that arrived mislabelled is worth knowing about before you save
            it under the wrong extension.
          </p>
        </div>

        <div className="prose prose--wide" style={{ marginTop: 24 }}>
          <table className="spec">
            <caption>The checks, in the order they run</caption>
            <thead>
              <tr>
                <th scope="col">Check</th>
                <th scope="col">What it catches</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Alphabet</th>
                <td>
                  Characters that base64 cannot contain — the quote or line number that came along
                  when the string was copied out of source code.
                </td>
              </tr>
              <tr>
                <th scope="row">Length</th>
                <td>
                  The character count is compared against the ceiling <em>before</em> anything is
                  decoded, so an oversized paste is refused rather than allocated.
                </td>
              </tr>
              <tr>
                <th scope="row">Arithmetic</th>
                <td>
                  Base64 encodes 3 bytes into 4 characters, so a length of 4n + 1 cannot exist. That
                  remainder means the string was cut, and it is reported as truncation rather than as
                  a decoding failure.
                </td>
              </tr>
              <tr>
                <th scope="row">Signature</th>
                <td>
                  The decoded bytes are matched against the format signatures. If nothing matches,
                  the string decoded but is not an image, and the tool says so instead of saving a
                  file with a misleading extension.
                </td>
              </tr>
              <tr>
                <th scope="row">Content type</th>
                <td>
                  A <code>data:</code> prefix that contradicts the signature is surfaced as a
                  warning, and the bytes win.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="online">
        <h2>Base64 to image online, nothing uploaded</h2>
        <p className="section__lede">
          &ldquo;Online&rdquo; means no install and no sign-up. It does not mean your string takes a
          trip through someone else&rsquo;s server.
        </p>

        <div className="prose">
          <p>
            Plenty of converters post your string to a backend, decode it there, and stream the image
            back. This one does the whole thing in page memory: the string is parsed, decoded and
            turned into a blob without a single network request carrying it. That matters more here
            than in the other direction, because base64 strings are frequently the exact thing you
            were trying not to put on the wire — an inline image from a private document, a payload
            out of an internal API response, a screenshot someone sent you in confidence.
          </p>
          <p>
            It is not a claim you have to take on faith. Open your browser&rsquo;s developer tools,
            switch to the Network tab, and decode something. Nothing carrying the string or the
            resulting image leaves the page.
          </p>
        </div>

        <div className="cards2" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">Local by design</span>
            <h3>No upload, no queue, no quota</h3>
            <p>
              Decoding speed is bounded by your own CPU. There is no per-day limit, because there is
              no server counting requests and nothing to rate-limit.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Verifiable</span>
            <h3>Check it yourself</h3>
            <p>
              DevTools, Network tab, decode a string. The only requests you will see are the ones
              that loaded this page in the first place.
            </p>
          </div>
        </div>
      </Section>

      <Section id="decode" alt>
        <h2>Decode base64 to image and get the bytes back</h2>
        <p className="section__lede">
          The decoded output is a real binary file, not a text rendering of one. That distinction is
          where most of the work is.
        </p>

        <div className="prose">
          <p>
            Decoding reverses the encoding exactly: every 4 characters become 3 bytes, the padding
            is dropped, and what is left is byte-for-byte the file that was encoded. Round-tripping
            an image through this tool and back through the other one returns the original bytes,
            which is why the download button produces something your operating system recognises
            rather than a file that only looks right.
          </p>
          <p>
            The text form is always larger than the file it carries. Base64 spends 4 characters per
            3 bytes, so roughly a quarter of the string is overhead — the &ldquo;smaller than the
            text&rdquo; figure on the result panel is that ratio, measured against the string you
            actually pasted rather than an estimate.
          </p>
        </div>

        <div className="prose prose--wide" style={{ marginTop: 24 }}>
          <table className="spec">
            <caption>What the result panel is telling you</caption>
            <thead>
              <tr>
                <th scope="col">Figure</th>
                <th scope="col">How it is obtained</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Decoded size</th>
                <td>
                  The real byte length of the decoded buffer — the size the saved file will be, not
                  an estimate derived from the string length.
                </td>
              </tr>
              <tr>
                <th scope="row">Smaller than the text</th>
                <td>
                  The ratio between the decoded bytes and the normalised payload, so whitespace you
                  pasted in does not distort it.
                </td>
              </tr>
              <tr>
                <th scope="row">Pixels</th>
                <td>
                  Read from the decoded image itself. Shown as a dash when the format is valid but
                  carries no intrinsic size — an SVG without <code>width</code> and{" "}
                  <code>height</code>, for instance.
                </td>
              </tr>
              <tr>
                <th scope="row">Detected</th>
                <td>
                  The format as measured from the bytes, with the prefix&rsquo;s claim shown next to
                  it whenever the two disagree.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="formats-and-limits">
        <h2>Base64 to PNG, JPG, WebP or SVG</h2>
        <p className="section__lede">
          Any format with a recognisable signature, identified from the decoded bytes rather than
          from a label.
        </p>

        <div className="prose prose--wide">
          <table className="spec">
            <caption>Formats this decoder recognises</caption>
            <thead>
              <tr>
                <th scope="col">Format</th>
                <th scope="col">Signature, and what it means for you</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">PNG</th>
                <td>
                  Matched on the full eight-byte signature. Lossless with transparency, and the
                  format most screenshot tools emit.
                </td>
              </tr>
              <tr>
                <th scope="row">JPG / JPEG</th>
                <td>
                  Matched on the <code>FF D8 FF</code> marker rather than a bare <code>FF D8</code>,
                  which is too generic to be evidence of anything.
                </td>
              </tr>
              <tr>
                <th scope="row">GIF</th>
                <td>
                  Both <code>GIF87a</code> and <code>GIF89a</code>. Only the first frame is shown in
                  the preview; the download carries the whole animation.
                </td>
              </tr>
              <tr>
                <th scope="row">WebP</th>
                <td>Matched through the RIFF container header.</td>
              </tr>
              <tr>
                <th scope="row">SVG</th>
                <td>
                  Markup, not pixels, so it is recognised from its text rather than from a byte
                  signature.
                </td>
              </tr>
              <tr>
                <th scope="row">BMP / ICO</th>
                <td>
                  Matched on their leading bytes. ICO is the one format here whose signature starts
                  with a run of zero bytes.
                </td>
              </tr>
              <tr>
                <th scope="row">AVIF</th>
                <td>
                  Read out of the ISO base media container, where the brand is checked rather than
                  assumed — the same container also carries HEIC, which browsers still cannot render.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="note" style={{ marginTop: 28 }}>
          <p>
            <b>SVG is never inlined into this page.</b> A decoded SVG is previewed through an{" "}
            <code>&lt;img&gt;</code> element, which loads it in a context where scripts do not run.
            Rendering SVG markup directly into the document is how a decoder becomes an XSS vector,
            and it is a mistake a lot of converters make.
          </p>
        </div>

        <div className="prose" style={{ marginTop: 24 }}>
          <h3>Boundaries</h3>
          <ul>
            <li>
              <b>10 MB of decoded data.</b> Roughly 14 million characters of base64. The limit is
              applied to the string length before decoding, so an oversized paste is refused instead
              of stalling the tab.
            </li>
            <li>
              <b>One string at a time.</b> This tool answers a single question, so there is no batch
              mode to reason about.
            </li>
            <li>
              <b>Unknown formats are refused.</b> A string that decodes into something without a
              recognised image signature is reported as such, rather than saved as a{" "}
              <code>.png</code> that will not open.
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
