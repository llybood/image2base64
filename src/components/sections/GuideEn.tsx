import { Section } from "./Section";

/**
 * English long-form content.
 *
 * Each H2 answers one of the queries this page targets, and the body of
 * the section is the part that actually earns the ranking — the heading
 * alone would be a claim without substance. Kept as JSX rather than a
 * string dictionary because the structure (lists, tables, asides) is part
 * of the answer.
 */
export function GuideEn() {
  return (
    <>
      <Section id="convert">
        <h2>Convert image to base64 in three ways</h2>
        <p className="section__lede">
          Three ways in, one consistent result — and the same numbers reported for every one of them.
        </p>

        <div className="prose">
          <p>
            Everything this converter does starts the same way: it reads the image&rsquo;s bytes and
            re-expresses them as ASCII text. Whether those bytes come from a file picker, a drag, the
            clipboard or a remote address, the same encoding path runs. That is why the size figures
            above the result are directly comparable no matter how the image arrived — you are never
            comparing a measured value against a guessed one.
          </p>
        </div>

        <div className="cards3" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">Option 1</span>
            <h3>Pick a file</h3>
            <p>
              The standard file dialog, filtered to images. Selecting several files processes them as
              one batch and keeps each entry in the result list.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Option 2</span>
            <h3>Drop or paste</h3>
            <p>
              Drop images anywhere on the page, or press Ctrl+V (Cmd+V on macOS) to paste straight
              from the clipboard — handy for screenshots that were never saved to disk.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Option 3</span>
            <h3>Load from an address</h3>
            <p>
              Convert image URL to base64 by pasting a link. This path measures the real byte length
              too — see the section below for what happens when a host blocks cross-origin reads.
            </p>
          </div>
        </div>
      </Section>

      <Section id="url" alt>
        <h2>Convert image URL to base64</h2>
        <p className="section__lede">
          Fetching an image from another origin is the only part of this tool that can fail for
          reasons outside your control, so it fails loudly and explains itself.
        </p>

        <div className="prose">
          <p>
            The converter tries two strategies in order. The first is a plain{" "}
            <code>fetch</code> request, which is preferred because it hands back the exact byte
            length — the original size and the size increase you see are measurements, not
            estimates. The second is loading the image through an <code>&lt;img&gt;</code> element
            and drawing it onto a canvas, which works when the host allows cross-origin reads but a
            direct fetch was blocked.
          </p>
          <p>
            If the host forbids cross-origin access, the browser refuses to hand over the pixel data
            and both strategies fail. That refusal is a browser security policy, not a bug in the
            tool, and no amount of client-side code can work around it. When it happens, you get a
            specific explanation and a concrete next step: download the image and use local upload,
            where there is no origin boundary to cross in the first place.
          </p>
        </div>

        <div className="note">
          <p>
            <b>Why the fallback re-encodes to PNG.</b> A canvas can only export the pixels it holds,
            not the original container. Images loaded through that path come back as PNG, so their
            reported base64 size is approximate and the format shown is PNG even if the source was a
            JPEG. The direct fetch path has no such caveat.
          </p>
        </div>

        <div className="prose prose--wide">
          <table className="spec">
            <caption>What happens to an image URL, step by step</caption>
            <thead>
              <tr>
                <th scope="col">Step</th>
                <th scope="col">What the tool does</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Normalise</th>
                <td>
                  Trims whitespace and adds <code>https://</code> when a bare hostname is entered, so{" "}
                  <code>example.com/pic.png</code> and <code>https://example.com/pic.png</code> both
                  work.
                </td>
              </tr>
              <tr>
                <th scope="row">Fetch</th>
                <td>
                  Requests the bytes with credentials omitted. A non-image content type is rejected
                  before any encoding happens.
                </td>
              </tr>
              <tr>
                <th scope="row">Verify</th>
                <td>
                  The container format is detected from the file&rsquo;s magic bytes rather than
                  trusted from the response header, so the data URI prefix can never disagree with
                  the payload it introduces.
                </td>
              </tr>
              <tr>
                <th scope="row">Encode</th>
                <td>
                  Bytes are converted to base64 in fixed-size chunks, which keeps very large images
                  from exhausting the call stack.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="online">
        <h2>Image to base64 online, with nothing uploaded</h2>
        <p className="section__lede">
          &ldquo;Online&rdquo; here means no install and no sign-up — not that your file takes a trip
          through someone else&rsquo;s disk.
        </p>

        <div className="prose">
          <p>
            Most converters on the web upload your image to a server, encode it there and send the
            text back. This one does not. The file is read with the browser&rsquo;s own FileReader
            API and encoded in page memory, so the bytes never leave the machine. That is not a
            marketing claim you have to take on faith: open your browser&rsquo;s network panel while
            converting and you will see no request carrying your image.
          </p>
          <p>
            The practical consequence is that the tool is usable for material you would not
            comfortably hand to a third party — internal screenshots, client work, images with
            metadata attached — and that there is no file size ceiling imposed by an upload limit or
            a conversion queue.
          </p>
        </div>

        <div className="cards2" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">Local by design</span>
            <h3>No upload, no queue, no quota</h3>
            <p>
              Conversion speed is bounded by your own disk and CPU, and there is no per-day limit
              because there is no server counting requests.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Verifiable</span>
            <h3>Check it yourself</h3>
            <p>
              Open DevTools, switch to the Network tab, and convert an image. Nothing carrying the
              file leaves the page.
            </p>
          </div>
        </div>
      </Section>

      <Section id="encode" alt>
        <h2>What base64 encode actually does to a file</h2>
        <p className="section__lede">
          Base64 exists to carry binary data through channels that only accept text. The cost is a
          predictable amount of bloat.
        </p>

        <div className="prose">
          <p>
            The encoding takes 3 bytes of binary data — 24 bits — and splits them into 4 groups of 6
            bits, each of which maps onto one of 64 printable ASCII characters. So every 3 bytes
            become 4 characters: a fixed 4/3 ratio, or about 33% growth. When the input length is not
            divisible by 3, the final group is padded with one or two <code>=</code> characters to
            keep the total a multiple of 4.
          </p>
        </div>

        <div className="prose prose--wide" style={{ marginTop: 24 }}>
          <table className="spec">
            <caption>Measured effects you can see in the result panel</caption>
            <thead>
              <tr>
                <th scope="col">Effect</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Payload growth</th>
                <td>
                  Roughly +33%, from the 4/3 character mapping. A 248 KB PNG becomes about 331 KB of
                  text.
                </td>
              </tr>
              <tr>
                <th scope="row">Data URI prefix</th>
                <td>
                  The <code>data:image/png;base64,</code> header adds a fixed 22 characters when you
                  copy the prefixed form rather than the raw string.
                </td>
              </tr>
              <tr>
                <th scope="row">Transfer cost</th>
                <td>
                  Text compresses well, so over gzip or brotli an inlined image often costs far less
                  than the raw base64 suggests.
                </td>
              </tr>
              <tr>
                <th scope="row">Caching</th>
                <td>
                  This is the real trade-off. An inlined image cannot be cached separately from the
                  document that carries it, so it is re-sent every time that document is.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="prose" style={{ marginTop: 32 }}>
          <h3>When a data URI is the right call</h3>
          <ul>
            <li>
              <b>Small icons and logos</b> that would otherwise each cost a separate round trip.
            </li>
            <li>
              <b>CSS that must be self-contained</b> — an email template, a single-file widget, or a
              component library shipped as one asset.
            </li>
            <li>
              <b>Images you need to generate at runtime</b> — a canvas export that has to travel as a
              string rather than a file.
            </li>
          </ul>

          <h3>When it is not</h3>
          <ul>
            <li>
              <b>Photographs and large artwork.</b> The 33% overhead compounds with the loss of
              separate caching and of progressive decoding.
            </li>
            <li>
              <b>Anything above roughly 10 KB per asset.</b> Beyond that a separate request is almost
              always the cheaper option.
            </li>
            <li>
              <b>Content that changes independently</b> of the page embedding it, since every change
              now invalidates the whole document.
            </li>
          </ul>
        </div>
      </Section>

      <Section id="formats-and-limits">
        <h2>Supported formats and limits</h2>

        <div className="prose prose--wide">
          <table className="spec">
            <caption>Accepted inputs</caption>
            <thead>
              <tr>
                <th scope="col">Format</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">JPG / JPEG</th>
                <td>Detected by the <code>FF D8</code> marker; the usual choice for photographs.</td>
              </tr>
              <tr>
                <th scope="row">PNG</th>
                <td>Lossless, supports transparency, and the format the canvas fallback exports.</td>
              </tr>
              <tr>
                <th scope="row">GIF</th>
                <td>Encoded from the original bytes; only the first frame is previewed inline.</td>
              </tr>
              <tr>
                <th scope="row">WebP</th>
                <td>Detected via the <code>RIFF&hellip;WEBP</code> header.</td>
              </tr>
              <tr>
                <th scope="row">SVG</th>
                <td>
                  Read as text, so the payload matches the original markup byte for byte — no binary
                  round-trip to corrupt it.
                </td>
              </tr>
              <tr>
                <th scope="row">BMP / ICO</th>
                <td>Encoded from the original bytes and previewed as-is.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="prose" style={{ marginTop: 28 }}>
          <h3>Boundaries</h3>
          <ul>
            <li>
              <b>10 MB per file.</b> Larger files are refused with the actual size shown, rather than
              failing silently halfway through.
            </li>
            <li>
              <b>20 files per batch</b>, with the most recent 30 kept in the result list.
            </li>
            <li>
              <b>Cross-origin images need the host&rsquo;s permission.</b> Without CORS headers the
              browser blocks the read, and the tool says so instead of returning a broken string.
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
