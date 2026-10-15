# Bauer Produktion – Website

Roleplay in Szene gesetzt. Statische Website auf GitHub Pages. Neue Instagram-Bilder und YouTube-Videos kommen jeden Morgen automatisch dazu.

## Einmalige Einrichtung

1. **Instagram:** auf ein Creator-Konto umstellen (Einstellungen → Kontotyp und Tools).
2. **Behold:** auf [behold.so](https://behold.so) registrieren, Instagram verbinden, einen Feed anlegen und die **JSON-Feed-URL** kopieren.
3. **GitHub:** ein Konto anlegen, dieses Projekt als Repository hochladen, dann:
   - *Settings → Secrets and variables → Actions → New repository secret*: Name `BEHOLD_FEED_URL`, Wert = die Feed-URL.
   - *Settings → Pages → Source*: **GitHub Actions**.
   - *Actions → Sync & Deploy → Run workflow* einmal von Hand starten.
4. Die Website ist danach unter `https://<dein-name>.github.io/<repo>/` erreichbar.

## Pflege

| Ich möchte … | So geht's |
|---|---|
| neue Bilder zeigen | Einfach auf Instagram posten. Sie erscheinen am nächsten Morgen. Sofort: *Actions → Run workflow*. |
| ein neues Video zeigen | Auf YouTube hochladen (keine Shorts). Es erscheint automatisch. |
| ein älteres Bild ergänzen | Datei in den Ordner `manual/` hochladen, am besten als `JJJJ-MM-TT_name.jpg`. |
| ein Bild/Video ausblenden | Die `id` aus `data/photos.json` bzw. `data/videos.json` in `data/hidden.json` eintragen. |
| ein Script eintragen | `data/scripts.json` bearbeiten (siehe Beispiel unten). |
| die Follower-Zahl ändern | In `index.html` bei `data-count="690"` die Zahl anpassen (zweimal: Attribut und Text). |

Beispiel für `data/scripts.json`:
```json
[
  {
    "name": "bauer_carshow",
    "description": "Kurzbeschreibung des Scripts.",
    "features": ["Feature 1", "Feature 2"],
    "image": "assets/scripts/carshow.webp",
    "link": "https://github.com/…",
    "linkLabel": "Auf GitHub ansehen"
  }
]
```

## Entwicklung

```bash
cd tools
npm install
npm test          # Tests
npm run dev-seed  # Testdaten in dev-data/ erzeugen
```
Lokal starten: `python -m http.server 8080` im Projektordner, dann `http://localhost:8080/?dev` öffnen (`?dev` nutzt die Testdaten, `?reduced` simuliert „Bewegung reduzieren“).

Eigene Domain später: *Settings → Pages → Custom domain*, danach beim Domain-Anbieter einen CNAME-Eintrag auf `<dein-name>.github.io` setzen.
