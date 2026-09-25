import { Section } from "./Section";

/**
 * German long-form content.
 *
 * Mirrors the English guide section for section — same structure, same
 * depth, same five target queries answered in the same order — because a
 * thinner German page would be a different product, not a translation of
 * this one. Each H2 answers exactly one of the queries this page targets,
 * and the body of the section is what actually earns the ranking.
 *
 * Kept as JSX rather than a string dictionary because the structure
 * (lists, tables, asides) is part of the answer.
 */
export function GuideDe() {
  return (
    <>
      <Section id="convert">
        <h2>Bild zu Base64 konvertieren: drei Wege</h2>
        <p className="section__lede">
          Drei Wege hinein, ein einheitliches Ergebnis — und für alle drei dieselben Zahlen.
        </p>

        <div className="prose">
          <p>
            Alles, was dieser Konverter tut, beginnt gleich: Er liest die Bytes des Bildes und
            drückt sie als ASCII-Text aus. Ob diese Bytes aus einem Dateidialog, einem Drag, der
            Zwischenablage oder einer entfernten Adresse stammen, es läuft derselbe Kodierpfad. Genau
            deshalb sind die Größenangaben über dem Ergebnis unabhängig vom Weg vergleichbar — du
            stellst nie einen gemessenen Wert einem geschätzten gegenüber.
          </p>
        </div>

        <div className="cards3" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">Weg 1</span>
            <h3>Datei auswählen</h3>
            <p>
              Der gewohnte Dateidialog, auf Bilder gefiltert. Mehrere ausgewählte Dateien werden als
              ein Stapel verarbeitet und bleiben einzeln in der Ergebnisliste stehen.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Weg 2</span>
            <h3>Ziehen oder einfügen</h3>
            <p>
              Zieh Bilder irgendwo auf die Seite, oder drücke Strg+V (Cmd+V unter macOS), um direkt
              aus der Zwischenablage einzufügen — praktisch für Screenshots, die nie auf der Platte
              gelandet sind.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Weg 3</span>
            <h3>Aus einer Adresse laden</h3>
            <p>
              Bild-URL zu Base64 umwandeln, indem du einen Link einfügst. Auch dieser Weg misst die
              echte Bytelänge — was passiert, wenn ein Host Cross-Origin-Zugriffe blockiert, steht im
              nächsten Abschnitt.
            </p>
          </div>
        </div>
      </Section>

      <Section id="url" alt>
        <h2>Bild-URL zu Base64 umwandeln</h2>
        <p className="section__lede">
          Ein Bild aus einem anderen Origin zu holen ist der einzige Teil dieses Werkzeugs, der aus
          Gründen scheitern kann, die außerhalb deiner Kontrolle liegen — also scheitert er laut und
          erklärt sich.
        </p>

        <div className="prose">
          <p>
            Der Konverter probiert nacheinander zwei Strategien. Zuerst eine einfache{" "}
            <code>fetch</code>-Anfrage, die bevorzugt wird, weil sie die exakte Bytelänge
            zurückliefert — die angezeigte Originalgröße und Größenzunahme sind damit Messungen und
            keine Schätzungen. Danach das Laden über ein <code>&lt;img&gt;</code>-Element und
            Zeichnen auf ein Canvas, was greift, wenn der Host Cross-Origin-Zugriffe erlaubt, ein
            direkter fetch aber blockiert wurde.
          </p>
          <p>
            Verbietet der Host den Cross-Origin-Zugriff, verweigert der Browser die Herausgabe der
            Pixeldaten und beide Strategien scheitern. Diese Verweigerung ist eine
            Sicherheitsrichtlinie des Browsers und kein Fehler des Werkzeugs; kein clientseitiger
            Code kann sie umgehen. Wenn es dazu kommt, bekommst du eine konkrete Erklärung und einen
            ebenso konkreten nächsten Schritt: das Bild herunterladen und den lokalen Upload nutzen,
            wo es gar keine Origin-Grenze zu überschreiten gibt.
          </p>
        </div>

        <div className="note">
          <p>
            <b>Warum der Fallback nach PNG neu kodiert.</b> Ein Canvas kann nur die Pixel
            exportieren, die es hält, nicht den ursprünglichen Container. Bilder, die über diesen Weg
            geladen werden, kommen als PNG zurück; ihre angegebene Base64-Größe ist daher
            näherungsweise und das angezeigte Format ist PNG, auch wenn die Quelle ein JPEG war. Der
            direkte fetch-Weg hat diesen Vorbehalt nicht.
          </p>
        </div>

        <div className="prose prose--wide">
          <table className="spec">
            <caption>Was mit einer Bild-URL Schritt für Schritt passiert</caption>
            <thead>
              <tr>
                <th scope="col">Schritt</th>
                <th scope="col">Was das Werkzeug tut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Normalisieren</th>
                <td>
                  Entfernt Leerzeichen und ergänzt <code>https://</code>, wenn nur ein Hostname
                  eingegeben wurde, sodass <code>example.com/pic.png</code> und{" "}
                  <code>https://example.com/pic.png</code> beide funktionieren.
                </td>
              </tr>
              <tr>
                <th scope="row">Abrufen</th>
                <td>
                  Fordert die Bytes ohne Anmeldedaten an. Ein Content-Type, der kein Bild ist, wird
                  abgelehnt, bevor überhaupt kodiert wird.
                </td>
              </tr>
              <tr>
                <th scope="row">Prüfen</th>
                <td>
                  Das Containerformat wird anhand der Magic Bytes der Datei erkannt statt dem
                  Antwort-Header zu vertrauen, damit das Data-URI-Präfix nie im Widerspruch zur
                  Nutzlast stehen kann, die es einleitet.
                </td>
              </tr>
              <tr>
                <th scope="row">Kodieren</th>
                <td>
                  Die Bytes werden in Blöcken fester Größe nach Base64 umgewandelt, was verhindert,
                  dass sehr große Bilder den Aufrufstapel sprengen.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="online">
        <h2>Bild in Base64 umwandeln online – ohne Upload</h2>
        <p className="section__lede">
          &bdquo;Online&ldquo; heißt hier: keine Installation und keine Anmeldung — nicht, dass deine
          Datei eine Reise über eine fremde Festplatte macht.
        </p>

        <div className="prose">
          <p>
            Die meisten Konverter im Netz laden dein Bild auf einen Server, kodieren es dort und
            schicken den Text zurück. Dieser nicht. Die Datei wird mit der FileReader-API des
            Browsers gelesen und im Seitenspeicher kodiert, die Bytes verlassen den Rechner also
            nicht. Das ist keine Werbeaussage, die du glauben musst: Öffne während der Umwandlung das
            Netzwerk-Panel deines Browsers, und du wirst keine Anfrage sehen, die dein Bild
            transportiert.
          </p>
          <p>
            Die praktische Folge ist, dass das Werkzeug auch für Material taugt, das du nicht
            bedenkenlos an Dritte geben würdest — interne Screenshots, Kundenarbeit, Bilder mit
            angehängten Metadaten — und dass es keine Obergrenze gibt, die ein Upload-Limit oder eine
            Warteschlange vorschreiben würde.
          </p>
        </div>

        <div className="cards2" style={{ marginTop: 28 }}>
          <div className="mini">
            <span className="mini__k">Lokal by design</span>
            <h3>Kein Upload, keine Warteschlange, kein Kontingent</h3>
            <p>
              Die Geschwindigkeit hängt nur von deiner eigenen Festplatte und CPU ab, und es gibt kein
              Tageslimit, weil kein Server Anfragen zählt.
            </p>
          </div>
          <div className="mini">
            <span className="mini__k">Nachprüfbar</span>
            <h3>Prüf es selbst</h3>
            <p>
              Öffne die Entwicklerwerkzeuge, wechsle in den Netzwerk-Tab und wandle ein Bild um.
              Nichts, was die Datei trägt, verlässt die Seite.
            </p>
          </div>
        </div>
      </Section>

      <Section id="encode" alt>
        <h2>Base64 kodieren: was dabei mit der Datei passiert</h2>
        <p className="section__lede">
          Base64 existiert, um Binärdaten durch Kanäle zu schleusen, die nur Text annehmen. Der Preis
          dafür ist ein vorhersehbarer Zuwachs.
        </p>

        <div className="prose">
          <p>
            Die Kodierung nimmt 3 Bytes Binärdaten — 24 Bit — und teilt sie in 4 Gruppen zu je 6 Bit,
            von denen jede auf eines von 64 druckbaren ASCII-Zeichen abgebildet wird. Aus je 3 Bytes
            werden also 4 Zeichen: ein festes Verhältnis von 4/3, rund 33 % Wachstum. Ist die
            Eingabelänge nicht durch 3 teilbar, wird die letzte Gruppe mit einem oder zwei{" "}
            <code>=</code>-Zeichen aufgefüllt, damit die Gesamtlänge ein Vielfaches von 4 bleibt.
          </p>
        </div>

        <div className="prose prose--wide" style={{ marginTop: 24 }}>
          <table className="spec">
            <caption>Messbare Effekte, die du im Ergebnisbereich siehst</caption>
            <thead>
              <tr>
                <th scope="col">Effekt</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Wachstum der Nutzlast</th>
                <td>
                  Ungefähr +33 %, bedingt durch die 4/3-Zeichenabbildung. Aus einem PNG mit 248 KB
                  werden rund 331 KB Text.
                </td>
              </tr>
              <tr>
                <th scope="row">Data-URI-Präfix</th>
                <td>
                  Der Kopf <code>data:image/png;base64,</code> fügt feste 22 Zeichen hinzu, wenn du
                  die Variante mit Präfix statt des reinen Strings kopierst.
                </td>
              </tr>
              <tr>
                <th scope="row">Übertragungskosten</th>
                <td>
                  Text lässt sich gut komprimieren, über gzip oder brotli kostet ein eingebettetes
                  Bild daher oft deutlich weniger, als das rohe Base64 vermuten lässt.
                </td>
              </tr>
              <tr>
                <th scope="row">Caching</th>
                <td>
                  Das ist der eigentliche Kompromiss. Ein eingebettetes Bild lässt sich nicht getrennt
                  vom Dokument zwischenspeichern, das es trägt, und wird daher bei jedem Versand
                  dieses Dokuments erneut mitgeschickt.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="prose" style={{ marginTop: 32 }}>
          <h3>Wann sich eine Data URI lohnt</h3>
          <ul>
            <li>
              <b>Kleine Symbole und Logos</b>, die sonst jeweils eine eigene Rundreise kosten würden.
            </li>
            <li>
              <b>CSS, das eigenständig sein muss</b> — eine E-Mail-Vorlage, ein Widget in einer
              einzigen Datei oder eine Komponentenbibliothek, die als ein Asset ausgeliefert wird.
            </li>
            <li>
              <b>Bilder, die zur Laufzeit entstehen</b> — ein Canvas-Export, der als String
              weitergereicht werden muss statt als Datei.
            </li>
          </ul>

          <h3>Wann nicht</h3>
          <ul>
            <li>
              <b>Fotos und große Grafiken.</b> Die 33 % Mehraufwand verstärken sich mit dem Verlust
              von getrenntem Caching und progressivem Dekodieren.
            </li>
            <li>
              <b>Alles über etwa 10 KB pro Asset.</b> Darüber ist eine eigene Anfrage fast immer die
              günstigere Variante.
            </li>
            <li>
              <b>Inhalte, die sich unabhängig</b> von der einbettenden Seite ändern, denn nun
              invalidiert jede Änderung das ganze Dokument.
            </li>
          </ul>
        </div>
      </Section>

      <Section id="formats-and-limits">
        <h2>Unterstützte Formate und Grenzen</h2>

        <div className="prose prose--wide">
          <table className="spec">
            <caption>Akzeptierte Eingaben</caption>
            <thead>
              <tr>
                <th scope="col">Format</th>
                <th scope="col">Hinweise</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">JPG / JPEG</th>
                <td>
                  Erkannt am Marker <code>FF D8</code>; die übliche Wahl für Fotos.
                </td>
              </tr>
              <tr>
                <th scope="row">PNG</th>
                <td>
                  Verlustfrei, unterstützt Transparenz, und das Format, das der Canvas-Fallback
                  exportiert.
                </td>
              </tr>
              <tr>
                <th scope="row">GIF</th>
                <td>
                  Aus den Originalbytes kodiert; inline wird nur das erste Einzelbild angezeigt.
                </td>
              </tr>
              <tr>
                <th scope="row">WebP</th>
                <td>
                  Erkannt über den Header <code>RIFF&hellip;WEBP</code>.
                </td>
              </tr>
              <tr>
                <th scope="row">SVG</th>
                <td>
                  Wird als Text gelesen, die Nutzlast entspricht also Byte für Byte dem
                  Original-Markup — ohne binäre Rundreise, die etwas beschädigen könnte.
                </td>
              </tr>
              <tr>
                <th scope="row">BMP / ICO</th>
                <td>Aus den Originalbytes kodiert und unverändert angezeigt.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="prose" style={{ marginTop: 28 }}>
          <h3>Grenzen</h3>
          <ul>
            <li>
              <b>10 MB pro Datei.</b> Größere Dateien werden mit der tatsächlichen Größe abgelehnt,
              statt auf halbem Weg still zu scheitern.
            </li>
            <li>
              <b>20 Dateien pro Stapel</b>, wobei die letzten 30 Einträge in der Ergebnisliste
              erhalten bleiben.
            </li>
            <li>
              <b>Cross-Origin-Bilder brauchen die Erlaubnis des Hosts.</b> Ohne CORS-Header blockiert
              der Browser das Lesen, und das Werkzeug sagt das, statt einen kaputten String
              zurückzugeben.
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
