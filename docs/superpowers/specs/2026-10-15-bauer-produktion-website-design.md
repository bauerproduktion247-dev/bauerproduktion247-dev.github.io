# Bauer Produktion – Website · Design-Spec

Datum: 2026-10-15 · Status: zur Prüfung

## 1. Ziel

Eine eigenständige, moderne und stark animierte Website für **Bauer Produktion**, ein privates
Roleplay-Fotostudio (GTA RP): Shootings, Edits, Stories und Video-Projekte. Die Seite zeigt die
Arbeiten, erklärt das Angebot und führt zur Kontaktaufnahme. FiveM-Scripts gibt es als eigenen,
klar abgegrenzten Unterbereich.

**Erfolgskriterien**
- Besucher verstehen in wenigen Sekunden, was Bauer Produktion macht, und finden den Kontakt.
- Neue Instagram-Bilder und YouTube-Videos erscheinen **ohne manuellen Eingriff** innerhalb eines Tages.
- Die Seite kostet im Betrieb **0 €**.
- Sie läuft flüssig auf PC und Handy, auch mit vielen Bildern.

## 2. Rahmenbedingungen

| Thema | Entscheidung |
|---|---|
| Hosting | GitHub Pages (kostenlos). Eine eigene Domain (z. B. bauer-produktion.de) kann später ergänzt werden. |
| Technik | Statisches HTML/CSS/JavaScript ohne Build-Schritt, GSAP (lokal eingebunden) für Animationen |
| Instagram-Quelle | Behold.so, Gratisplan, JSON-Feed (6 neueste Posts, 1× täglich aktualisiert, 1.200 Abrufe pro Monat) |
| YouTube-Quelle | Öffentlicher RSS-Feed des Kanals `UCIxu3ooS7E4l_XP2ptHnZKw` (@bauerproduktion), ohne API-Schlüssel |
| Sprache | Deutsch |
| Rechtlicher Rahmen | Privat, nicht geschäftsmäßig, kein Impressum. Nur ein kurzer Datenschutzhinweis. |
| Externe Anfragen | Keine Tracker, keine Cookies, keine fremden Schriften oder CDNs. YouTube wird erst nach Klick geladen (youtube-nocookie.com). |

## 3. Gestaltung – „Noir Editorial“

- **Farben:** Schwarz (`#000`) und Weiß, Grautöne nur für Linien und Sekundärtext. **Farbe kommt
  ausschließlich aus den Fotos.**
- **Schrift:** eine feine, geometrische Sans-Serif mit weiter Sperrung für Überschriften, passend
  zum Logo (z. B. *Montserrat* bzw. *Josefin Sans* in Light/ExtraLight, lokal eingebunden). Für
  Fließtext eine gut lesbare Sans wie *Inter*.
- **Textur:** dezentes, animiertes Filmkorn als Overlay.
- **Kamera-Details** als Akzente: Sucher-Ecken, Auslöser-Blitz beim Öffnen der Großansicht, Zähler
  im Stil „04 / 12“.
- **Logo:** die vorhandenen Logos (`assets/logo/`) werden zu einem SVG vektorisiert. Die Varianten
  liegen bei: horizontal schwarz, horizontal weiß, quadratisch weiß.
- **Bewegung:** sanftes Scrollen. Alle großen Animationen entfallen bei `prefers-reduced-motion`.
  Ohne JavaScript bleiben alle Inhalte sichtbar.

## 4. Seitenaufbau

### Startseite `index.html`

| # | Bereich | Inhalt | Animation |
|---|---|---|---|
| – | Navigation | BAUER · Portfolio · Videos · Leistungen · Über · Scripts · Kontakt | Fix. Blendet beim Runterscrollen aus, beim Hochscrollen ein. Auf dem Handy als Vollbild-Menü. |
| 01 | Hero | Logo, Leitsatz „Jede Rolle verdient ihr Bild.“ | Das Logo wird Strich für Strich gezeichnet, dann füllt sich die Silhouette. Der Schriftzug blendet buchstabenweise ein. Im Hintergrund schimmert ein aktuelles Foto, dazu ein Scroll-Hinweis. |
| 02 | Neueste Shootings | Die 12 neuesten Bilder | Horizontaler Filmstreifen. Der Bereich bleibt beim Scrollen stehen, die Bilder fahren seitwärts. Zähler und Fortschrittslinie. Auf dem Handy horizontal wischbar statt fixiert. |
| 03 | Portfolio-Archiv | Alle gesammelten Bilder, in 24er-Schritten „Mehr laden“ | Asymmetrisches Editorial-Raster mit Vorhang-Reveal. Die Großansicht hat Auslöser-Blitz, Pfeiltasten/Wischen, Esc und einen Link zum Instagram-Post. |
| 04 | Video-Projekte | Neueste YouTube-Videos ohne Shorts, max. 6 | Vollbild-Stapel: Jede Vorschau füllt den Bildschirm, die nächste schiebt sich darüber. „▶“ lädt erst dann den Player. |
| 05 | Leistungen | Shootings · Edits · Stories, Hinweis zur Aufwandsentschädigung, Bildrechte | Drei große Zeilen, beim Überfahren mit der Maus erscheint ein Bild. |
| 06 | Über | Kurztext und Kennzahlen | Text erscheint zeilenweise, Zahlen zählen hoch. |
| 07 | Scripts-Teaser | Banner, Link auf `scripts.html` | Terminal-Optik als bewusster Stilbruch, Tipp-Animation. |
| 08 | Kontakt | Discord, Instagram, YouTube, E-Mail | Großer Schriftzug. Der Discord-Name lässt sich per Klick kopieren, mit Bestätigung. |
| 09 | Footer | Logo, Link zum Datenschutzhinweis, © Bauer Produktion | keine |

### Unterseiten
- **`scripts.html`:** gleiche Navigation und gleicher Footer. Script-Karten (Name, Kurzbeschreibung,
  Vorschaubild, Features, Link) werden aus `data/scripts.json` erzeugt. Hier ist mehr Code- und
  Terminal-Optik erlaubt, das Grundgerüst bleibt Noir.
- **`datenschutz.html`:** kurzer Hinweis (siehe 6.4).

## 5. Daten & Automatik

### 5.1 Dateistruktur
```
bauer-produktion/
├─ index.html · scripts.html · datenschutz.html
├─ css/style.css
├─ js/          main.js (Init, Nav, Scroll) · logo.js · gallery.js · lightbox.js · videos.js · scripts.js
├─ vendor/      gsap/ (gsap, ScrollTrigger, DrawSVG) · lenis/ · fonts/
├─ assets/logo/ Logo-Rasterdateien + logo.svg
├─ data/        photos.json · videos.json · hidden.json · scripts.json
├─ media/photos/   <id>-800.webp · <id>-1600.webp
├─ manual/      eigene, ältere Bilder (beliebiges Format)
├─ tools/       sync.mjs · lib/*.mjs · test/*.test.mjs · package.json
└─ .github/workflows/sync.yml
```

### 5.2 Datenformate
`photos.json`, neueste zuerst:
```json
[{ "id": "ig_1801…", "source": "instagram", "date": "2026-10-12T18:00:00Z",
   "caption": "…", "permalink": "https://www.instagram.com/p/…",
   "src": "media/photos/ig_1801-1600.webp", "thumb": "media/photos/ig_1801-800.webp",
   "w": 1080, "h": 1350 }]
```
`videos.json`: `id` (YouTube-ID), `title`, `date`, `thumb` und `thumbSmall`. Die Vorschaubilder werden beim Sync
heruntergeladen und lokal unter `media/videos/` gespeichert, damit vor dem Klick keine Verbindung zu Google entsteht.
`hidden.json`: `{ "photos": ["ig_…"], "videos": ["…"] }`.

### 5.3 Ablauf von `sync.mjs`
1. **Instagram:** Lädt den Behold-JSON-Feed (URL aus dem Secret `BEHOLD_FEED_URL`). Für jeden Post
   vom Typ `IMAGE` oder `CAROUSEL_ALBUM` (Album: alle Bilder) ohne bekannte `id` wird das Bild
   geladen, mit `sharp` auf 800 px und 1600 px Breite als WebP gespeichert und der Eintrag ergänzt.
   Reels und Videos aus Instagram werden ignoriert.
2. **YouTube:** Lädt den RSS-Feed. Shorts erkennt das Script daran, dass
   `https://www.youtube.com/shorts/<id>` mit HTTP 200 antwortet und nicht weiterleitet. Diese
   Videos werden übersprungen. Neue Videos werden ergänzt.
3. **Manuell:** Dateien in `manual/` ohne Eintrag werden genauso verarbeitet (`source: "manual"`,
   Datum aus dem Dateidatum).
4. Die Ergebnisse werden nach Datum sortiert und nur bei Änderungen geschrieben.

**Garantien:** Das Script löscht nie Einträge oder Dateien. Schlägt eine Quelle fehl, wird das
geloggt, die anderen Quellen laufen weiter, und die bestehenden Daten bleiben unverändert.
`hidden.json` blendet Einträge nur auf der Website aus.

### 5.4 GitHub Action `sync.yml`
- Läuft täglich um 05:00 UTC und lässt sich manuell starten (`workflow_dispatch`).
- Node 20: `npm ci` in `tools/`, dann `node sync.mjs`.
- Bei Änderungen wird committet („chore: sync media“). GitHub Pages veröffentlicht danach automatisch.
- Etwa 30 Behold-Abrufe pro Monat, also weit unter dem Limit von 1.200.

### 5.5 Laden auf der Website
- Die Seite lädt `data/*.json` per `fetch`. Schlägt das fehl oder ist eine Liste leer, wird der
  zugehörige Bereich samt Navigationspunkt ausgeblendet.
- Bilder werden per Lazy Loading mit `srcset` (800/1600) und festen Seitenverhältnissen (`w`/`h`)
  geladen, damit das Layout beim Laden nicht springt.

## 6. Inhalte (Entwürfe – vom Inhaber freizugeben)

### 6.1 Leistungen
- **Shootings:** „Deine Figur, dein Moment. Ob Porträt, Paar, Crew oder Fahrzeug – wir setzen deine
  Rolle in Szene.“
- **Edits:** „Farblook, Retusche, Atmosphäre. Aus einem guten Screenshot wird ein Bild mit Geschichte.“
- **Stories & Videos:** „Kurze Clips, Carporn, Ankündigungen und Trailer für Projekte, Fraktionen und Firmen.“
- **Hinweis:** „Bauer Produktion ist ein privates Hobbyprojekt. Es gibt keine festen Preise. Über eine
  freiwillige Aufwandsentschädigung freue ich mich, sie ist aber kein Muss.“

### 6.2 Bildrechte
„Alle Fotos und Videos werden von Bauer Produktion erstellt, die **Urheberrechte bleiben bei Bauer
Produktion**. Du darfst deine Bilder für dein Roleplay nutzen, etwa auf Social Media, in Discord oder
auf deinem Server, wenn du **@bauer_rp** als Quelle nennst. Weiterverkauf, das Ausgeben als eigene
Arbeit oder das Entfernen der Kennzeichnung ist nicht erlaubt. Bauer Produktion darf alle Aufnahmen
im eigenen Portfolio und auf Social Media zeigen.“

### 6.3 Über
„Hinter Bauer Produktion steckt die Leidenschaft, Roleplay so festzuhalten, wie es sich anfühlt:
filmisch, nah und mit Charakter. Jede Rolle verdient ihr Bild.“ Kennzahlen: Follower (aktueller
Stand von Hand, z. B. „690+“), Anzahl der Bilder im Archiv (automatisch aus `photos.json`), Anzahl
der Videos (automatisch).

### 6.4 Datenschutzhinweis (Kurzfassung)
Verantwortlich: Bauer Produktion, bauer.produktion.247@gmail.com. Gehostet bei GitHub Pages
(GitHub Inc.), der Server verarbeitet technisch notwendige Zugriffsdaten wie die IP-Adresse. Es
gibt keine Cookies, kein Tracking und keine Kontaktformulare. YouTube-Videos werden erst nach
aktivem Klick geladen, dann gelten die Datenschutzbestimmungen von Google. Links zu Instagram,
YouTube und Discord führen zu Drittanbietern. *Hinweis: Das ist keine Rechtsberatung.*

### 6.5 Kontakt
Discord `dominikbauer` (kopierbar) · Instagram [@bauer_rp](https://www.instagram.com/bauer_rp/) ·
YouTube [@bauerproduktion](https://www.youtube.com/@bauerproduktion) ·
E-Mail `bauer.produktion.247@gmail.com` (mailto-Link).

### 6.6 Scripts
`data/scripts.json` startet mit den Scripts, die der Inhaber benennt (Name, Beschreibung, Features,
Bild, Link). Bis dahin zeigt die Unterseite einen gestalteten Hinweis „Scripts folgen in Kürze“.

## 7. Einrichtung durch den Inhaber (einmalig)
1. Instagram auf ein Creator-Konto umstellen und bei Behold.so registrieren, den Account verbinden
   und einen JSON-Feed anlegen.
2. Ein GitHub-Konto anlegen. Das Repository wird gemeinsam erstellt, die Feed-URL wird als Secret
   `BEHOLD_FEED_URL` hinterlegt und GitHub Pages aktiviert.
3. Optional später: Domain kaufen und in GitHub Pages sowie den DNS-Einstellungen verbinden.

## 8. Tests
- **Automatisch** (`node --test` in `tools/`): Zusammenführen ohne Duplikate, keine Löschungen,
  Sortierung, Shorts-Filter (mit gemockten Antworten), Ausfall einer Quelle lässt die Daten
  unverändert, Verarbeitung von Karussell-Posts, Verarbeitung manueller Bilder.
- **Manuell bzw. im Browser:** Desktop und Handy (375 px), reduzierte Bewegung, ohne JavaScript,
  leere oder fehlende JSON-Dateien, Tastaturbedienung der Großansicht, Lighthouse
  (Performance ≥ 85, Barrierefreiheit ≥ 90).

## 9. Nicht im Umfang
Kontaktformular, Buchungssystem, Preisliste, Kundenstimmen, Mehrsprachigkeit, CMS bzw.
Admin-Oberfläche, Instagram-Reels auf der Website.
