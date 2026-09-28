import { Section } from "./Section";

/**
 * Deutscher Langtext für die umgekehrte Richtung (base64 → Bild).
 *
 * Aufgebaut wie `GuideDe` und aus demselben Grund: jede H2 beantwortet
 * eine der Suchanfragen, auf die diese Seite zielt, und der Fließtext ist
 * das, was die Platzierung tatsächlich trägt. Die Inhalte wiederholen die
 * Vorwärtsseite bewusst nicht — die Gegenrichtung hat eigenen Stoff, und
 * genau das rechtfertigt eine eigene Seite.
 *
 * Anrede durchgehend „du", wie im restlichen deutschen Wörterbuch.
 */
export function GuideDeDecode() {
  return (
    <>
      <Section id="convert">
        <h2>Base64 zu Bild: drei Wege hinein</h2>
        <p className="section__lede">
          Ein Eingabefeld, drei Arten es zu füllen — und alle drei akzeptieren dieselbe Bandbreite
          an Strings.
        </p>

        <div className="prose">
          <p>
            Ein Base64-String erreicht dich in der Form, die das erzeugende Werkzeug gerade
            vorgegeben hat: als reine Nutzlast aus einer API-Antwort, als vollständige{" "}
            <code>data:image/png;base64,…</code>-URI aus einem Stylesheet, als zitierter Ausschnitt
            aus einer Logzeile oder als URL-sichere Variante aus einem Token. Dieser Decoder
            normalisiert all das, bevor er einen einzigen Byte ansieht. Die Form des Strings ist
            damit nie etwas, das du von Hand aufräumen musst.
          </p>
        </div>

        <div className="cards3" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">Weg 1</span>
            <h3>Aus der Zwischenablage einfügen</h3>
            <p>
              Der Knopf liest die Zwischenablage direkt aus. Praktisch, wenn der String länger ist
              als du scrollen möchtest, und wenn die Quelle zwar kopiert, aber nicht auswählen
              lässt.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Weg 2</span>
            <h3>Strg+V, irgendwo</h3>
            <p>
              Strg+V (auf macOS Cmd+V) bei fokussierter Seite — du musst nicht erst ins Feld
              klicken. Einfügen ist die Geste, um die dieses Werkzeug herum gebaut ist, also
              funktioniert sie überall.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Weg 3</span>
            <h3>Tippen oder hineinziehen</h3>
            <p>
              Das Bearbeiten läuft live: das Bild erscheint und aktualisiert sich mit dem String.
              Damit kannst du einen abgeschnittenen Text Zeichen für Zeichen bis zum letzten
              gültigen Zeichen kürzen und zusehen, wann wieder ein Bild daraus wird.
            </p>
          </div>
        </div>

        <div className="note" style={{ marginTop: 32 }}>
          <p>
            <b>Was als gültiger String zählt.</b> Zeilenumbrüche und Leerzeichen werden ignoriert,
            ein umbrochener String funktioniert also direkt. Das URL-sichere Alphabet (
            <code>-</code> und <code>_</code>) wird übersetzt, fehlendes <code>=</code>-Padding
            ergänzt. Umschließende Anführungszeichen, <code>url(…)</code>-Hüllen und jedes{" "}
            <code>data:</code>-Präfix werden entfernt. Nur Zeichen, die wirklich kein Base64 sind,
            bleiben übrig und werden als Fehler gemeldet.
          </p>
        </div>
      </Section>

      <Section id="converter" alt>
        <h2>Was ein Base64-Bild-Konverter leisten muss</h2>
        <p className="section__lede">
          Das Dekodieren ist ein einziger Funktionsaufruf. Zu wissen, <em>was</em> die Bytes sind,
          ist der Teil, der ein brauchbares Werkzeug von einem scheinbar brauchbaren trennt.
        </p>

        <div className="prose">
          <p>
            Ein reiner Base64-String trägt überhaupt keine Typinformation. Er ist nur eine Zahl zur
            Basis 64 — kein Byte darin sagt &bdquo;PNG&ldquo; oder &bdquo;JPEG&ldquo;. Der einzige
            Hinweis ist das <code>data:</code>-Präfix, und das ist eine Bezeichnung, die irgendwer
            geschrieben hat, keine Tatsache über die Bytes. Bezeichnungen wandern bei umbenannten
            Dateien mit, werden beim Formatwechsel mitkopiert und von manchen Exportern fest
            verdrahtet, ohne je geprüft zu werden.
          </p>
          <p>
            Deshalb liest dieses Werkzeug die Bytes. Es gleicht die ersten Bytes gegen die bekannten
            Signaturen aller unterstützten Formate ab und behandelt das Präfix als zu
            überprüfende Behauptung statt als Wahrheitsquelle. Widersprechen sich beide, erfährst
            du, wer gewonnen hat — denn eine falsch etikettierte Datei ist etwas, das man wissen
            will, bevor man sie unter der falschen Endung speichert.
          </p>
        </div>

        <div className="prose prose--wide" style={{ marginTop: 24 }}>
          <table className="spec">
            <caption>Die Prüfungen in ihrer Reihenfolge</caption>
            <thead>
              <tr>
                <th scope="col">Prüfung</th>
                <th scope="col">Was sie abfängt</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Alphabet</th>
                <td>
                  Zeichen, die Base64 nicht enthalten kann — das Anführungszeichen oder die
                  Zeilennummer, die beim Kopieren aus dem Quelltext mitgekommen sind.
                </td>
              </tr>
              <tr>
                <th scope="row">Länge</th>
                <td>
                  Die Zeichenzahl wird <em>vor</em> dem Dekodieren gegen die Obergrenze geprüft.
                  Eine zu große Einfügung wird also abgelehnt, statt allokiert zu werden.
                </td>
              </tr>
              <tr>
                <th scope="row">Arithmetik</th>
                <td>
                  Base64 kodiert 3 Bytes zu 4 Zeichen, eine Länge von 4n + 1 kann es daher nicht
                  geben. Dieser Rest heißt: der String ist abgeschnitten — und wird als
                  Abschneiden gemeldet, nicht als unklares Dekodierproblem.
                </td>
              </tr>
              <tr>
                <th scope="row">Signatur</th>
                <td>
                  Die dekodierten Bytes werden gegen die Formatssignaturen geprüft. Passt keine,
                  ließ sich der String zwar dekodieren, ist aber kein Bild — und das wird gesagt,
                  statt eine Datei mit irreführender Endung zu speichern.
                </td>
              </tr>
              <tr>
                <th scope="row">Übereinstimmung</th>
                <td>
                  Ein <code>data:</code>-Präfix, das der Signatur widerspricht, wird als Warnung
                  angezeigt; die Bytes gewinnen.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="online">
        <h2>Base64 in Bild umwandeln online – ohne Upload</h2>
        <p className="section__lede">
          &bdquo;Online&ldquo; heißt: keine Installation, keine Anmeldung. Es heißt nicht, dass
          dein String über einen fremden Server läuft.
        </p>

        <div className="prose">
          <p>
            Viele Konverter schicken deinen String an ein Backend, dekodieren ihn dort und schicken
            das Bild zurück. Dieser hier erledigt alles im Speicher der Seite: Der String wird
            geparst, dekodiert und in einen Blob verwandelt, ohne dass auch nur eine Anfrage ihn
            transportiert. Das wiegt in dieser Richtung schwerer als in der anderen, denn
            Base64-Strings sind häufig genau das, was man nicht auf die Leitung legen wollte — ein
            eingebettetes Bild aus einem internen Dokument, eine Nutzlast aus einer internen
            API-Antwort, ein Screenshot, den dir jemand vertraulich geschickt hat.
          </p>
          <p>
            Das ist keine Behauptung, die man glauben muss. Öffne die Entwicklerwerkzeuge, wechsle
            auf den Netzwerk-Tab und dekodiere etwas: Nichts, was den String oder das entstehende
            Bild trägt, verlässt die Seite.
          </p>
        </div>

        <div className="cards2" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">Lokal by design</span>
            <h3>Kein Upload, keine Warteschlange, kein Kontingent</h3>
            <p>
              Die Geschwindigkeit hängt nur an deiner CPU. Es gibt kein Tageslimit, weil kein Server
              mitzählt und nichts zu drosseln ist.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Nachprüfbar</span>
            <h3>Prüf es selbst</h3>
            <p>
              Entwicklerwerkzeuge, Netzwerk-Tab, String dekodieren. Du siehst nur die Anfragen, die
              diese Seite ohnehin geladen haben.
            </p>
          </div>
        </div>
      </Section>

      <Section id="decode" alt>
        <h2>Base64 dekodieren: was aus dem String wird</h2>
        <p className="section__lede">
          Das Ergebnis ist eine echte Binärdatei, keine textliche Darstellung davon. Genau hier
          steckt die Arbeit.
        </p>

        <div className="prose">
          <p>
            Dekodieren kehrt die Kodierung exakt um: je 4 Zeichen entstehen 3 Bytes, das Padding
            fällt weg, und übrig bleibt Byte für Byte die Datei, die kodiert wurde. Ein Bild durch
            dieses Werkzeug und wieder durch das andere zu schicken liefert die Originalbytes
            zurück — deshalb erzeugt der Download-Knopf etwas, das dein Betriebssystem erkennt, und
            keine Datei, die nur richtig aussieht.
          </p>
          <p>
            Die Textform ist immer größer als die Datei, die sie trägt. Base64 verbraucht 4 Zeichen
            pro 3 Bytes, rund ein Viertel des Strings ist also Overhead — die Angabe
            &bdquo;kleiner als der Text&ldquo; in der Ergebnisanzeige ist genau dieses Verhältnis,
            gemessen am tatsächlich eingefügten String und nicht geschätzt.
          </p>
        </div>

        <div className="prose prose--wide" style={{ marginTop: 24 }}>
          <table className="spec">
            <caption>Was die Ergebnisanzeige dir sagt</caption>
            <thead>
              <tr>
                <th scope="col">Wert</th>
                <th scope="col">Woher er kommt</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Dekodierte Größe</th>
                <td>
                  Die echte Bytelänge des dekodierten Puffers — also die Größe der gespeicherten
                  Datei, keine Schätzung aus der Stringlänge.
                </td>
              </tr>
              <tr>
                <th scope="row">Kleiner als der Text</th>
                <td>
                  Das Verhältnis zwischen dekodierten Bytes und normalisierter Nutzlast, damit
                  eingefügte Leerzeichen das Ergebnis nicht verzerren.
                </td>
              </tr>
              <tr>
                <th scope="row">Pixel</th>
                <td>
                  Aus dem dekodierten Bild selbst gelesen. Erscheint als Strich, wenn das Format
                  gültig ist, aber keine eigene Größe mitbringt — etwa ein SVG ohne{" "}
                  <code>width</code> und <code>height</code>.
                </td>
              </tr>
              <tr>
                <th scope="row">Erkannt</th>
                <td>
                  Das an den Bytes gemessene Format, mit der Behauptung des Präfixes daneben,
                  sobald beide auseinandergehen.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="formats-and-limits">
        <h2>Base64 zu PNG, JPG, WebP oder SVG</h2>
        <p className="section__lede">
          Jedes Format mit erkennbarer Signatur — bestimmt aus den dekodierten Bytes, nicht aus
          einer Bezeichnung.
        </p>

        <div className="prose prose--wide">
          <table className="spec">
            <caption>Formate, die dieser Decoder erkennt</caption>
            <thead>
              <tr>
                <th scope="col">Format</th>
                <th scope="col">Signatur und was sie für dich bedeutet</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">PNG</th>
                <td>
                  Geprüft über die vollständige Acht-Byte-Signatur. Verlustfrei, mit Transparenz,
                  und das Format, das die meisten Screenshot-Werkzeuge ausgeben.
                </td>
              </tr>
              <tr>
                <th scope="row">JPG / JPEG</th>
                <td>
                  Erkannt am <code>FF D8 FF</code>-Marker statt an einem bloßen <code>FF D8</code>,
                  das als Beleg zu beliebig wäre.
                </td>
              </tr>
              <tr>
                <th scope="row">GIF</th>
                <td>
                  Sowohl <code>GIF87a</code> als auch <code>GIF89a</code>. Die Vorschau zeigt nur
                  das erste Bild, der Download enthält die ganze Animation.
                </td>
              </tr>
              <tr>
                <th scope="row">WebP</th>
                <td>Erkannt über den RIFF-Container-Kopf.</td>
              </tr>
              <tr>
                <th scope="row">SVG</th>
                <td>
                  Auszeichnungssprache, keine Pixel — wird deshalb am Text erkannt und nicht an
                  einer Bytesignatur.
                </td>
              </tr>
              <tr>
                <th scope="row">BMP / ICO</th>
                <td>
                  Erkannt an den führenden Bytes. ICO ist hier das einzige Format, dessen Signatur
                  mit einer Folge von Nullbytes beginnt.
                </td>
              </tr>
              <tr>
                <th scope="row">AVIF</th>
                <td>
                  Aus dem ISO-Base-Media-Container gelesen, wobei die Marke geprüft statt
                  angenommen wird — derselbe Container trägt auch HEIC, das Browser bis heute nicht
                  darstellen können.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="note" style={{ marginTop: 28 }}>
          <p>
            <b>SVG wird nie in diese Seite eingebettet.</b> Ein dekodiertes SVG wird über ein{" "}
            <code>&lt;img&gt;</code>-Element angezeigt, in dem Skripte nicht ausgeführt werden. SVG-
            Markup direkt ins Dokument zu rendern ist der Weg, auf dem ein Decoder zum XSS-Vektor
            wird — und genau das machen viele Online-Konverter.
          </p>
        </div>

        <div className="prose" style={{ marginTop: 24 }}>
          <h3>Grenzen</h3>
          <ul>
            <li>
              <b>10 MB dekodierte Daten.</b> Rund 14 Millionen Base64-Zeichen. Die Grenze gilt für
              die Stringlänge und wird vor dem Dekodieren geprüft, damit eine zu große Einfügung
              abgelehnt wird, statt den Tab zu blockieren.
            </li>
            <li>
              <b>Ein String auf einmal.</b> Dieses Werkzeug beantwortet eine einzelne Frage, es gibt
              also keinen Stapelmodus, über den man nachdenken müsste.
            </li>
            <li>
              <b>Unbekannte Formate werden abgelehnt.</b> Ein String, der zu etwas ohne erkennbare
              Bildsignatur dekodiert, wird als solcher gemeldet statt als <code>.png</code>{" "}
              gespeichert, das sich nicht öffnen lässt.
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
