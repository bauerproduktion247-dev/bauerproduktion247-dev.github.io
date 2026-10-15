# Bauer Produktion Website – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Statische, stark animierte „Noir Editorial“-Website für Bauer Produktion. Instagram-Bilder (über Behold) und YouTube-Videos werden täglich per GitHub Action eingesammelt und über GitHub Pages veröffentlicht.

**Architecture:** Die Website besteht aus reinem HTML/CSS/ES-Modulen ohne Build-Schritt. Sie liest `data/*.json` und animiert mit GSAP und Lenis, beide lokal unter `vendor/`. Ein Node-Script (`tools/sync.mjs`) holt den Behold-Feed, den YouTube-RSS-Feed und den Ordner `manual/`, verkleinert Bilder mit `sharp` und *ergänzt* die JSON-Dateien. Löschen ist nie vorgesehen. Ein Workflow synchronisiert, committet und deployt nach GitHub Pages.

**Tech Stack:** HTML5, CSS, JavaScript-ES-Module, GSAP 3.13 (ScrollTrigger, DrawSVGPlugin), Lenis 1.1, Node 20+ (`node:test`), sharp, potrace, GitHub Actions, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-10-15-bauer-produktion-website-design.md`

## Global Constraints

- Sprache der Website: Deutsch. Code-Bezeichner sind Englisch.
- Gestaltung „Noir Editorial“: nur `#000`, `#fff` und Grautöne. Farbe kommt ausschließlich aus Fotos.
- Keine externen Anfragen beim Seitenaufruf: keine CDNs, keine Google Fonts, keine Tracker, keine Cookies. YouTube wird erst nach Klick über `https://www.youtube-nocookie.com/embed/<id>` geladen. Video-Vorschaubilder liegen lokal unter `media/videos/`.
- Alle Inhalte müssen ohne JavaScript sichtbar sein. Bei `prefers-reduced-motion: reduce` entfallen große Animationen (kein Pinning, kein Lenis, kein Zeichnen).
- Das Sync-Script löscht **nie** Einträge oder Dateien. Fällt eine Quelle aus, bleiben die anderen Quellen und die bestehenden Daten erhalten.
- YouTube-Kanal-ID: `UCIxu3ooS7E4l_XP2ptHnZKw`. Behold-Feed-URL nur aus dem Secret `BEHOLD_FEED_URL`.
- Kontakt: Discord `dominikbauer`, Instagram `https://www.instagram.com/bauer_rp/`, YouTube `https://www.youtube.com/@bauerproduktion`, E-Mail `bauer.produktion.247@gmail.com`.
- Bildgrößen: 800 px und 1600 px Breite, WebP mit Qualität 82, nie hochskaliert.
- Filmstreifen: max. 12 Bilder. Archiv: 24 pro „Mehr laden“. Videos: max. 6, ohne Shorts.
- Node ≥ 20. Tests mit `node --test` (in `tools/`).
- Betrieb kostenlos: GitHub Pages, Behold-Gratisplan (1 Abruf pro Sync).

## Review Focus

1. **Beschädigte `data/photos.json`** (z. B. halb committet): Der Sync muss abbrechen, statt die Datei mit einer leeren Liste zu überschreiben. Ein Test in Task 6 prüft das.
2. **Abgelaufene oder kaputte Bild-URL eines einzelnen Instagram-Posts:** Nur dieser Post wird übersprungen, alle anderen werden gespeichert, und der Post wird am nächsten Tag erneut versucht. Ein Test in Task 6 prüft das.
3. **Erster Deploy ohne Daten** (leere JSON-Dateien): Bereiche und Navigationspunkte werden ausgeblendet, es gibt keine JS-Fehler. Abgedeckt durch `visible()`-Tests in Task 8 und die Browserprüfung in Task 15.
4. **Dateinamen in `manual/` mit Leerzeichen, Umlauten oder gleichem Namen:** Sie ergeben stabile, eindeutige IDs. Tests in Task 5.
5. **Instagram-Captions mit Hashtags, Emojis oder HTML-Zeichen:** Daraus werden saubere Alt-Texte, die nie als HTML eingefügt werden (nur `textContent`/`alt`). Ein Test für `altText()` steht in Task 8.

---

## Dateistruktur

| Datei | Verantwortung |
|---|---|
| `tools/package.json` | Abhängigkeiten und npm-Scripts für Sync, Tests, Vendor und Logo |
| `tools/lib/store.mjs` | JSON lesen (mit Fallback nur bei fehlender Datei) und nur bei Änderung schreiben |
| `tools/lib/merge.mjs` | Einträge ohne Duplikate ergänzen, nach Datum sortieren |
| `tools/lib/instagram.mjs` | Behold-JSON → Liste von Bildkandidaten |
| `tools/lib/images.mjs` | Bild → 800/1600-WebP |
| `tools/lib/youtube.mjs` | RSS parsen, Shorts erkennen, URLs bauen |
| `tools/lib/manual.mjs` | `manual/`-Ordner → Kandidaten mit stabilen IDs |
| `tools/sync.mjs` | Orchestrierung und CLI |
| `tools/vendor.mjs` | GSAP, Lenis und Schriften nach `vendor/` kopieren |
| `tools/trace-logo.mjs` | Logo-PNG → `assets/logo/logo.svg` und Favicons |
| `tools/dev-seed.mjs` | Lokale Testdaten in `dev-data/` (nicht im Repo) |
| `tools/test/*.test.mjs` | Tests |
| `js/data.js` | Laden und Filtern der Daten, Hilfsfunktionen (in Node testbar) |
| `js/motion.js` | GSAP-Plugins, Lenis, Erkennung reduzierter Bewegung |
| `js/ui.js` | Navigation, Kopieren, Zähler, Reveal, Leistungen-Hover, Zeichen-Split |
| `js/logo.js` | SVG laden und Zeichen-Animation |
| `js/lightbox.js` | Großansicht |
| `js/gallery.js` | Filmstreifen und Archiv-Raster |
| `js/videos.js` | Vollbild-Stapel und Klick-zum-Abspielen |
| `js/main.js` | Startseite verdrahten |
| `js/scripts.js` | Scripts-Unterseite |
| `index.html`, `scripts.html`, `datenschutz.html` | Seiten |
| `css/fonts.css`, `css/style.css` | Schriften und Gestaltung |
| `.github/workflows/pages.yml` | Sync, Commit, Deploy |
| `README.md` | Einrichtung und Pflege für den Inhaber |

---

### Task 1: Tools-Grundgerüst, JSON-Speicher und Zusammenführen

**Files:**
- Create: `tools/package.json`, `tools/lib/store.mjs`, `tools/lib/merge.mjs`
- Test: `tools/test/store.test.mjs`, `tools/test/merge.test.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `readJSON(file: string, fallback: any): Promise<any>` (wirft bei kaputtem JSON), `writeJSONIfChanged(file: string, data: any): Promise<boolean>`, `mergeEntries(existing: Entry[], incoming: Entry[]): { list: Entry[], added: Entry[] }` mit `Entry = { id: string, date: string, ... }`

- [ ] **Step 1: `tools/package.json` anlegen**

```json
{
  "name": "bauer-produktion-tools",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "node --test",
    "sync": "node sync.mjs",
    "vendor": "node vendor.mjs",
    "trace-logo": "node trace-logo.mjs",
    "dev-seed": "node dev-seed.mjs"
  },
  "dependencies": {
    "sharp": "0.33.5"
  },
  "devDependencies": {
    "@fontsource/inter": "5.1.0",
    "@fontsource/montserrat": "5.1.0",
    "gsap": "3.13.0",
    "lenis": "1.1.20",
    "potrace": "2.1.8"
  }
}
```

- [ ] **Step 2: Abhängigkeiten installieren**

Run (in `tools/`): `npm install`
Expected: `package-lock.json` wird angelegt, keine Fehler.

- [ ] **Step 3: `.gitignore` erweitern**

Inhalt von `.gitignore` komplett:
```
.superpowers/
node_modules/
dev-data/
_site/
```

- [ ] **Step 4: Fehlschlagende Tests schreiben**

`tools/test/store.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readJSON, writeJSONIfChanged } from '../lib/store.mjs';

const tmp = () => mkdtemp(join(tmpdir(), 'bp-store-'));

test('readJSON liefert Fallback, wenn Datei fehlt', async () => {
  const dir = await tmp();
  assert.deepEqual(await readJSON(join(dir, 'nope.json'), []), []);
});

test('readJSON wirft bei kaputtem JSON statt Fallback', async () => {
  const dir = await tmp();
  const file = join(dir, 'bad.json');
  await writeFile(file, '{oops');
  await assert.rejects(() => readJSON(file, []));
});

test('writeJSONIfChanged schreibt nur bei Änderung', async () => {
  const dir = await tmp();
  const file = join(dir, 'sub', 'a.json');
  assert.equal(await writeJSONIfChanged(file, [{ id: 'a' }]), true);
  assert.equal(await writeJSONIfChanged(file, [{ id: 'a' }]), false);
  assert.equal(await readFile(file, 'utf8'), '[\n  {\n    "id": "a"\n  }\n]\n');
});
```

`tools/test/merge.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeEntries } from '../lib/merge.mjs';

const e = (id, date) => ({ id, date });

test('ergänzt neue Einträge und sortiert neueste zuerst', () => {
  const { list, added } = mergeEntries([e('a', '2026-01-01')], [e('b', '2026-02-01')]);
  assert.deepEqual(list.map((x) => x.id), ['b', 'a']);
  assert.deepEqual(added.map((x) => x.id), ['b']);
});

test('keine Duplikate – weder zu Bestand noch innerhalb der neuen Liste', () => {
  const { list, added } = mergeEntries([e('a', '2026-01-01')], [e('a', '2026-01-01'), e('c', '2026-03-01'), e('c', '2026-03-01')]);
  assert.deepEqual(list.map((x) => x.id), ['c', 'a']);
  assert.equal(added.length, 1);
});

test('löscht nie Einträge, die in der neuen Liste fehlen', () => {
  const { list } = mergeEntries([e('alt', '2020-01-01'), e('x', '2026-01-01')], []);
  assert.deepEqual(list.map((x) => x.id), ['x', 'alt']);
});

test('ignoriert Einträge ohne id', () => {
  const { list } = mergeEntries([], [{ date: '2026-01-01' }, null, e('ok', '2026-01-01')]);
  assert.deepEqual(list.map((x) => x.id), ['ok']);
});

test('gleiche Daten behalten ihre Reihenfolge (Karussell)', () => {
  const { list } = mergeEntries([], [e('k1', '2026-05-01'), e('k2', '2026-05-01'), e('k3', '2026-05-01')]);
  assert.deepEqual(list.map((x) => x.id), ['k1', 'k2', 'k3']);
});
```

- [ ] **Step 5: Tests laufen lassen, sie müssen fehlschlagen**

Run (in `tools/`): `npm test`
Expected: FAIL mit `Cannot find module '../lib/store.mjs'` bzw. `merge.mjs`.

- [ ] **Step 6: Implementieren**

`tools/lib/store.mjs`:
```js
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function readJSON(file, fallback) {
  let raw;
  try {
    raw = await readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
  return JSON.parse(raw);
}

export async function writeJSONIfChanged(file, data) {
  const next = JSON.stringify(data, null, 2) + '\n';
  let prev = null;
  try {
    prev = await readFile(file, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (prev === next) return false;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, next);
  return true;
}
```

`tools/lib/merge.mjs`:
```js
export function mergeEntries(existing, incoming) {
  const known = new Set(existing.map((entry) => entry.id));
  const added = [];
  for (const item of incoming) {
    if (!item || typeof item.id !== 'string' || known.has(item.id)) continue;
    known.add(item.id);
    added.push(item);
  }
  const list = [...existing, ...added].sort((a, b) => new Date(b.date) - new Date(a.date));
  return { list, added };
}
```

- [ ] **Step 7: Tests laufen lassen**

Run (in `tools/`): `npm test`
Expected: PASS (8 Tests).

- [ ] **Step 8: Commit**

```bash
git add .gitignore tools/package.json tools/package-lock.json tools/lib tools/test
git commit -m "feat(tools): JSON-Speicher und Zusammenführen ohne Löschen"
```

---

### Task 2: Behold-Feed parsen

**Files:**
- Create: `tools/lib/instagram.mjs`, `tools/test/helpers.mjs`
- Test: `tools/test/instagram.test.mjs`

**Interfaces:**
- Produces: `parseBeholdFeed(json: object|array): Array<{ id: string, date: string, caption: string, permalink: string, imageUrl: string }>`. Die IDs haben die Form `ig_<postId>` bzw. bei Karussells `ig_<childId>`. Wirft bei unbekanntem Format.
- Produces (Test-Helfer, von Task 3–6 genutzt): `beholdFeed`, `rssXml`, `makeImage(w, h): Promise<Buffer>`, `fakeFetch(routes)`, `json(obj)`, `text(str)`, `bytes(buf)`, `status(code)`, `memoryLog()`

- [ ] **Step 1: Test-Helfer anlegen**

`tools/test/helpers.mjs`:
```js
import sharp from 'sharp';

export const beholdFeed = {
  username: 'bauer_rp',
  posts: [
    {
      id: '111', timestamp: '2026-10-10T12:00:00Z', permalink: 'https://www.instagram.com/p/AAA/',
      mediaType: 'IMAGE', mediaUrl: 'https://cdn.test/111.jpg', prunedCaption: 'Shooting #gta <b>',
      sizes: { full: { mediaUrl: 'https://cdn.test/111-full.jpg', width: 1080, height: 1350 } },
    },
    {
      id: '222', timestamp: '2026-10-11T12:00:00Z', permalink: 'https://www.instagram.com/p/BBB/',
      mediaType: 'CAROUSEL_ALBUM', caption: 'Album',
      children: [
        { id: '222a', mediaType: 'IMAGE', mediaUrl: 'https://cdn.test/222a.jpg' },
        { id: '222b', mediaType: 'VIDEO', mediaUrl: 'https://cdn.test/222b.mp4' },
        { id: '222c', mediaType: 'IMAGE', mediaUrl: 'https://cdn.test/222c.jpg', sizes: { full: { mediaUrl: 'https://cdn.test/222c-full.jpg' } } },
      ],
    },
    {
      id: '333', timestamp: '2026-10-12T12:00:00Z', permalink: 'https://www.instagram.com/p/CCC/',
      mediaType: 'VIDEO', mediaUrl: 'https://cdn.test/333.mp4', thumbnailUrl: 'https://cdn.test/333.jpg',
    },
  ],
};

export const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
<title>Bauer Produktion</title>
<published>2022-05-02T09:11:08+00:00</published>
<entry><id>yt:video:VID_LONG</id><yt:videoId>VID_LONG</yt:videoId><title>🔥 Pfister &amp; GT3 RS | Pure Carporn 🔥</title><published>2026-07-25T13:30:34+00:00</published></entry>
<entry><id>yt:video:VID_SHORT</id><yt:videoId>VID_SHORT</yt:videoId><title>Audi R8</title><published>2025-04-26T10:01:27+00:00</published></entry>
</feed>`;

export function makeImage(width, height) {
  return sharp({ create: { width, height, channels: 3, background: '#777777' } }).jpeg().toBuffer();
}

export const json = (obj) => () => new Response(JSON.stringify(obj), { status: 200, headers: { 'content-type': 'application/json' } });
export const text = (str) => () => new Response(str, { status: 200 });
export const bytes = (buf) => () => new Response(buf, { status: 200 });
export const status = (code) => () => new Response(null, { status: code });

export function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, opts = {}) => {
    calls.push({ url, method: opts.method ?? 'GET' });
    const route = routes[url];
    if (route === undefined) return new Response('not found', { status: 404 });
    if (route instanceof Error) throw route;
    return route(opts);
  };
  fn.calls = calls;
  return fn;
}

export function memoryLog() {
  const lines = { info: [], warn: [], error: [] };
  return { lines, info: (m) => lines.info.push(m), warn: (m) => lines.warn.push(m), error: (m) => lines.error.push(m) };
}
```

- [ ] **Step 2: Fehlschlagenden Test schreiben**

`tools/test/instagram.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBeholdFeed } from '../lib/instagram.mjs';
import { beholdFeed } from './helpers.mjs';

test('Bilder und Karussell-Bilder werden erkannt, Videos ignoriert', () => {
  const items = parseBeholdFeed(beholdFeed);
  assert.deepEqual(items.map((i) => i.id), ['ig_111', 'ig_222a', 'ig_222c']);
});

test('größte verfügbare Bild-URL wird genutzt', () => {
  const [single, childA, childC] = parseBeholdFeed(beholdFeed);
  assert.equal(single.imageUrl, 'https://cdn.test/111-full.jpg');
  assert.equal(childA.imageUrl, 'https://cdn.test/222a.jpg');
  assert.equal(childC.imageUrl, 'https://cdn.test/222c-full.jpg');
});

test('Karussell-Bilder erben Datum, Caption und Permalink', () => {
  const child = parseBeholdFeed(beholdFeed)[1];
  assert.equal(child.date, '2026-10-11T12:00:00Z');
  assert.equal(child.caption, 'Album');
  assert.equal(child.permalink, 'https://www.instagram.com/p/BBB/');
});

test('älteres Array-Format wird akzeptiert', () => {
  assert.equal(parseBeholdFeed(beholdFeed.posts).length, 3);
});

test('unbekanntes Format wirft', () => {
  assert.throws(() => parseBeholdFeed({ foo: 1 }), /Behold/);
});
```

- [ ] **Step 3: Test laufen lassen**

Run (in `tools/`): `npm test`
Expected: FAIL mit `Cannot find module '../lib/instagram.mjs'`.

- [ ] **Step 4: Implementieren**

`tools/lib/instagram.mjs`:
```js
function bestUrl(media) {
  return media?.sizes?.full?.mediaUrl ?? media?.sizes?.large?.mediaUrl ?? media?.mediaUrl ?? null;
}

export function parseBeholdFeed(json) {
  const posts = Array.isArray(json) ? json : Array.isArray(json?.posts) ? json.posts : null;
  if (!posts) throw new Error('Unbekanntes Behold-Format');
  const out = [];
  for (const post of posts) {
    const base = {
      date: post.timestamp,
      caption: post.prunedCaption ?? post.caption ?? '',
      permalink: post.permalink ?? null,
    };
    if (post.mediaType === 'IMAGE') {
      out.push({ ...base, id: `ig_${post.id}`, imageUrl: bestUrl(post) });
    } else if (post.mediaType === 'CAROUSEL_ALBUM') {
      for (const child of post.children ?? []) {
        if (child.mediaType !== 'IMAGE') continue;
        out.push({ ...base, id: `ig_${child.id}`, imageUrl: bestUrl(child) });
      }
    }
  }
  return out.filter((item) => item.imageUrl && item.date);
}
```

- [ ] **Step 5: Tests laufen lassen**

Run (in `tools/`): `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/lib/instagram.mjs tools/test/helpers.mjs tools/test/instagram.test.mjs
git commit -m "feat(tools): Behold-Feed parsen inkl. Karussells"
```

---

### Task 3: Bildverarbeitung

**Files:**
- Create: `tools/lib/images.mjs`
- Test: `tools/test/images.test.mjs`

**Interfaces:**
- Consumes: `makeImage` aus `tools/test/helpers.mjs`
- Produces: `SIZES = { thumb: 800, src: 1600 }`, `processImage(input: Buffer|string, id: string, outDir: string): Promise<{ thumb: string, src: string, w: number, h: number }>`. `thumb`/`src` sind **Dateinamen** (`<id>-800.webp`, `<id>-1600.webp`), `w`/`h` die Maße der großen Datei.

- [ ] **Step 1: Fehlschlagenden Test schreiben**

`tools/test/images.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { processImage } from '../lib/images.mjs';
import { makeImage } from './helpers.mjs';

test('erzeugt 800er und 1600er WebP mit korrekten Maßen', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bp-img-'));
  const out = await processImage(await makeImage(2000, 1000), 'ig_1', dir);
  assert.deepEqual(out, { thumb: 'ig_1-800.webp', src: 'ig_1-1600.webp', w: 1600, h: 800 });
  await access(join(dir, 'ig_1-800.webp'));
  const meta = await sharp(join(dir, 'ig_1-800.webp')).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.width, 800);
});

test('kleine Bilder werden nicht hochskaliert', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bp-img-'));
  const out = await processImage(await makeImage(500, 400), 'small', dir);
  assert.equal(out.w, 500);
  assert.equal(out.h, 400);
});

test('kaputte Daten werfen', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bp-img-'));
  await assert.rejects(() => processImage(Buffer.from('kein bild'), 'x', dir));
});
```

- [ ] **Step 2: Test laufen lassen**

Run (in `tools/`): `npm test`
Expected: FAIL mit `Cannot find module '../lib/images.mjs'`.

- [ ] **Step 3: Implementieren**

`tools/lib/images.mjs`:
```js
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export const SIZES = { thumb: 800, src: 1600 };

export async function processImage(input, id, outDir) {
  await mkdir(outDir, { recursive: true });
  const result = {};
  for (const [key, width] of Object.entries(SIZES)) {
    const file = `${id}-${width}.webp`;
    const info = await sharp(input, { failOn: 'error' })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(outDir, file));
    result[key] = file;
    if (key === 'src') {
      result.w = info.width;
      result.h = info.height;
    }
  }
  return result;
}
```

- [ ] **Step 4: Tests laufen lassen**

Run (in `tools/`): `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/lib/images.mjs tools/test/images.test.mjs
git commit -m "feat(tools): Bilder auf 800/1600 px WebP verkleinern"
```

---

### Task 4: YouTube-RSS und Shorts-Erkennung

**Files:**
- Create: `tools/lib/youtube.mjs`
- Test: `tools/test/youtube.test.mjs`

**Interfaces:**
- Consumes: `rssXml`, `fakeFetch`, `status` aus `helpers.mjs`
- Produces: `rssUrl(channelId): string`, `shortsUrl(videoId): string`, `thumbUrls(videoId): string[]` (maxres, dann hq), `parseYouTubeRss(xml: string): Array<{ id, title, date }>`, `isShort(videoId, fetchFn): Promise<boolean>`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

`tools/test/youtube.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseYouTubeRss, isShort, rssUrl, shortsUrl, thumbUrls } from '../lib/youtube.mjs';
import { rssXml, fakeFetch, status } from './helpers.mjs';

test('parst Videos inkl. HTML-Entities und ignoriert Kanal-Kopf', () => {
  assert.deepEqual(parseYouTubeRss(rssXml), [
    { id: 'VID_LONG', title: '🔥 Pfister & GT3 RS | Pure Carporn 🔥', date: '2026-07-25T13:30:34+00:00' },
    { id: 'VID_SHORT', title: 'Audi R8', date: '2025-04-26T10:01:27+00:00' },
  ]);
});

test('leerer oder kaputter Feed ergibt leere Liste', () => {
  assert.deepEqual(parseYouTubeRss('<feed></feed>'), []);
  assert.deepEqual(parseYouTubeRss('<entry><title>ohne id</title></entry>'), []);
});

test('Short = /shorts/<id> antwortet mit 200, sonst kein Short', async () => {
  const fetchFn = fakeFetch({ [shortsUrl('S')]: status(200), [shortsUrl('L')]: status(303) });
  assert.equal(await isShort('S', fetchFn), true);
  assert.equal(await isShort('L', fetchFn), false);
  assert.equal(fetchFn.calls[0].method, 'HEAD');
});

test('URLs', () => {
  assert.equal(rssUrl('UC1'), 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1');
  assert.deepEqual(thumbUrls('X'), ['https://i.ytimg.com/vi/X/maxresdefault.jpg', 'https://i.ytimg.com/vi/X/hqdefault.jpg']);
});
```

- [ ] **Step 2: Test laufen lassen**

Run (in `tools/`): `npm test`
Expected: FAIL mit `Cannot find module '../lib/youtube.mjs'`.

- [ ] **Step 3: Implementieren**

`tools/lib/youtube.mjs`:
```js
export const rssUrl = (channelId) => `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
export const shortsUrl = (videoId) => `https://www.youtube.com/shorts/${videoId}`;
export const thumbUrls = (videoId) => [
  `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
];

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&');

export function parseYouTubeRss(xml) {
  return xml.split('<entry>').slice(1).map((entry) => {
    const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(entry)?.[1];
    const title = /<title>([^<]*)<\/title>/.exec(entry)?.[1] ?? '';
    const date = /<published>([^<]+)<\/published>/.exec(entry)?.[1];
    return id && date ? { id, title: decode(title), date } : null;
  }).filter(Boolean);
}

export async function isShort(videoId, fetchFn = fetch) {
  const res = await fetchFn(shortsUrl(videoId), { method: 'HEAD', redirect: 'manual' });
  return res.status === 200;
}
```

- [ ] **Step 4: Tests laufen lassen**

Run (in `tools/`): `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/lib/youtube.mjs tools/test/youtube.test.mjs
git commit -m "feat(tools): YouTube-RSS parsen und Shorts erkennen"
```

---

### Task 5: Manuelle Bilder

**Files:**
- Create: `tools/lib/manual.mjs`, `manual/LIESMICH.txt`
- Test: `tools/test/manual.test.mjs`

**Interfaces:**
- Produces: `manualId(filename): string`, `dateFromFilename(filename): string|null`, `listManualFiles(dir): Promise<Array<{ id, file, date }>>`. Fehlt der Ordner, kommt `[]` zurück. Die Dateien werden nach Namen sortiert, ID-Kollisionen bekommen `-2`, `-3` usw.

- [ ] **Step 1: Fehlschlagenden Test schreiben**

`tools/test/manual.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { manualId, dateFromFilename, listManualFiles } from '../lib/manual.mjs';

test('IDs sind stabil, klein, ohne Umlaute und Sonderzeichen', () => {
  assert.equal(manualId('Über Nacht (1).JPG'), 'manual_ueber-nacht-1');
  assert.equal(manualId('2025-06-01_Sommer Dance.png'), 'manual_2025-06-01-sommer-dance');
  assert.equal(manualId('Straße.webp'), 'manual_strasse');
});

test('Datum aus Dateinamen-Präfix', () => {
  assert.equal(dateFromFilename('2025-06-01_sommer.jpg'), '2025-06-01T12:00:00.000Z');
  assert.equal(dateFromFilename('sommer.jpg'), null);
  assert.equal(dateFromFilename('2025-13-45_kaputt.jpg'), null);
});

test('listet nur Bilder, sortiert, mit eindeutigen IDs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bp-man-'));
  await writeFile(join(dir, 'foto-1.png'), 'x');
  await writeFile(join(dir, 'Foto 1.jpg'), 'x');
  await writeFile(join(dir, 'notiz.txt'), 'x');
  await writeFile(join(dir, '2024-12-24_weihnacht.jpg'), 'x');
  const list = await listManualFiles(dir);
  assert.deepEqual(list.map((m) => m.id), ['manual_2024-12-24-weihnacht', 'manual_foto-1', 'manual_foto-1-2']);
  assert.equal(list[0].date, '2024-12-24T12:00:00.000Z');
  assert.match(list[1].date, /^\d{4}-\d{2}-\d{2}T/);
});

test('fehlender Ordner ergibt leere Liste', async () => {
  assert.deepEqual(await listManualFiles(join(tmpdir(), 'gibt-es-nicht-bp')), []);
});
```

- [ ] **Step 2: Test laufen lassen**

Run (in `tools/`): `npm test`
Expected: FAIL mit `Cannot find module '../lib/manual.mjs'`.

- [ ] **Step 3: Implementieren**

`tools/lib/manual.mjs`:
```js
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|tiff?)$/i;

export function manualId(filename) {
  const slug = filename
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `manual_${slug || 'bild'}`;
}

export function dateFromFilename(filename) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[_ -]/.exec(filename);
  if (!match) return null;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], 12));
  if (date.getUTCMonth() !== +match[2] - 1 || date.getUTCDate() !== +match[3]) return null;
  return date.toISOString();
}

export async function listManualFiles(dir) {
  let names;
  try {
    names = await readdir(dir);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const used = new Map();
  const out = [];
  for (const name of names.filter((n) => IMAGE_EXT.test(n)).sort()) {
    const base = manualId(name);
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    const file = join(dir, name);
    const date = dateFromFilename(name) ?? (await stat(file)).mtime.toISOString();
    out.push({ id: count === 1 ? base : `${base}-${count}`, file, date });
  }
  return out;
}
```

Hinweis: Die Sortierung nach Namen ist für Großbuchstaben ASCII-basiert (`'F' < 'f'`). Im Test sortiert `Foto 1.jpg` deshalb vor `foto-1.png` und bekommt die ID ohne Suffix. Das ist gewollt, Hauptsache stabil.

`manual/LIESMICH.txt`:
```
Hier kannst du eigene, ältere Bilder ablegen (jpg, png, webp).
Tipp: Beginne den Dateinamen mit dem Datum, z. B. 2025-06-01_sommer.jpg –
dann wird das Bild an der richtigen Stelle im Archiv einsortiert.
Nach dem Hochladen auf GitHub erscheint das Bild automatisch auf der Website.
```

- [ ] **Step 4: Tests laufen lassen**

Run (in `tools/`): `npm test`
Expected: PASS. Falls der Test „listet nur Bilder …“ an der Reihenfolge `manual_foto-1` und `manual_foto-1-2` scheitert, die Erwartung **nicht** ändern, sondern die `.sort()`-Zeile prüfen.

- [ ] **Step 5: Commit**

```bash
git add tools/lib/manual.mjs tools/test/manual.test.mjs manual/LIESMICH.txt
git commit -m "feat(tools): manuelle Bilder mit stabilen IDs und Datum aus Dateiname"
```

---

### Task 6: Sync-Orchestrierung

**Files:**
- Create: `tools/sync.mjs`, `data/photos.json`, `data/videos.json`, `data/hidden.json`, `data/scripts.json`
- Test: `tools/test/sync.test.mjs`

**Interfaces:**
- Consumes: alle `tools/lib/*`-Funktionen aus Task 1–5
- Produces: `CHANNEL_ID = 'UCIxu3ooS7E4l_XP2ptHnZKw'`, `runSync({ root, beholdUrl, channelId, fetchFn, log }): Promise<{ addedPhotos: number, addedVideos: number, errors: string[], changed: boolean }>`
- Datenformat `photos.json`: `{ id, source: 'instagram'|'manual', date, caption, permalink|null, src: 'media/photos/<id>-1600.webp', thumb: 'media/photos/<id>-800.webp', w, h }`
- Datenformat `videos.json`: `{ id, title, date, thumb: 'media/videos/yt_<id>-1600.webp', thumbSmall: 'media/videos/yt_<id>-800.webp' }`

- [ ] **Step 1: Leere Datendateien anlegen**

`data/photos.json` und `data/videos.json` sowie `data/scripts.json`, jeweils mit dem Inhalt:
```json
[]
```
`data/hidden.json`:
```json
{
  "photos": [],
  "videos": []
}
```

- [ ] **Step 2: Fehlschlagenden Test schreiben**

`tools/test/sync.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, access, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runSync } from '../sync.mjs';
import { rssUrl, shortsUrl, thumbUrls } from '../lib/youtube.mjs';
import { beholdFeed, rssXml, makeImage, fakeFetch, json, text, bytes, status, memoryLog } from './helpers.mjs';

const BEHOLD = 'https://feeds.behold.so/test';
const CH = 'UCtest';

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'bp-sync-'));
  await mkdir(join(root, 'data'));
  const img = await makeImage(1200, 1500);
  const routes = {
    [BEHOLD]: json(beholdFeed),
    'https://cdn.test/111-full.jpg': bytes(img),
    'https://cdn.test/222a.jpg': bytes(img),
    'https://cdn.test/222c-full.jpg': bytes(img),
    [rssUrl(CH)]: text(rssXml),
    [shortsUrl('VID_LONG')]: status(303),
    [shortsUrl('VID_SHORT')]: status(200),
    [thumbUrls('VID_LONG')[0]]: status(404),
    [thumbUrls('VID_LONG')[1]]: bytes(await makeImage(480, 360)),
  };
  return { root, routes };
}

const read = async (root, name) => JSON.parse(await readFile(join(root, 'data', name), 'utf8'));
const opts = (root, routes, extra = {}) => ({ root, beholdUrl: BEHOLD, channelId: CH, fetchFn: fakeFetch(routes), log: memoryLog(), ...extra });

test('erster Lauf: Bilder und Videos ohne Shorts werden gespeichert', async () => {
  const { root, routes } = await setup();
  const res = await runSync(opts(root, routes));
  assert.equal(res.addedPhotos, 3);
  assert.equal(res.addedVideos, 1);
  assert.deepEqual(res.errors, []);
  const photos = await read(root, 'photos.json');
  assert.deepEqual(photos.map((p) => p.id), ['ig_222a', 'ig_222c', 'ig_111']);
  assert.equal(photos[2].src, 'media/photos/ig_111-1600.webp');
  assert.equal(photos[2].thumb, 'media/photos/ig_111-800.webp');
  assert.equal(photos[2].source, 'instagram');
  assert.equal(photos[2].w, 1200);
  await access(join(root, 'media', 'photos', 'ig_111-800.webp'));
  const videos = await read(root, 'videos.json');
  assert.deepEqual(videos, [{
    id: 'VID_LONG', title: '🔥 Pfister & GT3 RS | Pure Carporn 🔥', date: '2026-07-25T13:30:34+00:00',
    thumb: 'media/videos/yt_VID_LONG-1600.webp', thumbSmall: 'media/videos/yt_VID_LONG-800.webp',
  }]);
});

test('zweiter Lauf ohne Neues ändert nichts und lädt keine Bilder erneut', async () => {
  const { root, routes } = await setup();
  await runSync(opts(root, routes));
  const o = opts(root, routes);
  const res = await runSync(o);
  assert.equal(res.changed, false);
  assert.equal(res.addedPhotos, 0);
  assert.ok(!o.fetchFn.calls.some((c) => c.url.startsWith('https://cdn.test/')));
});

test('Behold-Ausfall: Bestand bleibt, YouTube läuft weiter', async () => {
  const { root, routes } = await setup();
  const existing = [{ id: 'ig_alt', source: 'instagram', date: '2020-01-01T00:00:00Z' }];
  await writeFile(join(root, 'data', 'photos.json'), JSON.stringify(existing));
  routes[BEHOLD] = status(500);
  const res = await runSync(opts(root, routes));
  assert.equal(res.errors.length, 1);
  assert.match(res.errors[0], /Instagram/);
  assert.deepEqual(await read(root, 'photos.json'), existing);
  assert.equal(res.addedVideos, 1);
});

test('kaputte Bild-URL: nur dieser Post fehlt, Rest wird gespeichert', async () => {
  const { root, routes } = await setup();
  routes['https://cdn.test/222a.jpg'] = status(403);
  const res = await runSync(opts(root, routes));
  assert.equal(res.addedPhotos, 2);
  assert.equal(res.errors.length, 1);
  assert.match(res.errors[0], /ig_222a/);
});

test('kaputte photos.json: Sync bricht ab und überschreibt nichts', async () => {
  const { root, routes } = await setup();
  await writeFile(join(root, 'data', 'photos.json'), '{oops');
  await assert.rejects(() => runSync(opts(root, routes)));
  assert.equal(await readFile(join(root, 'data', 'photos.json'), 'utf8'), '{oops');
});

test('ohne Behold-URL wird Instagram übersprungen und gewarnt', async () => {
  const { root, routes } = await setup();
  const o = opts(root, routes, { beholdUrl: undefined });
  const res = await runSync(o);
  assert.equal(res.addedPhotos, 0);
  assert.deepEqual(res.errors, []);
  assert.match(o.log.lines.warn[0], /BEHOLD_FEED_URL/);
});

test('manuelle Bilder werden aufgenommen', async () => {
  const { root, routes } = await setup();
  await mkdir(join(root, 'manual'));
  await writeFile(join(root, 'manual', '2024-12-24_weihnacht.jpg'), await makeImage(900, 600));
  const res = await runSync(opts(root, routes, { beholdUrl: undefined }));
  assert.equal(res.addedPhotos, 1);
  const [photo] = await read(root, 'photos.json');
  assert.equal(photo.id, 'manual_2024-12-24-weihnacht');
  assert.equal(photo.source, 'manual');
  assert.equal(photo.permalink, null);
  assert.equal(photo.date, '2024-12-24T12:00:00.000Z');
});
```

- [ ] **Step 3: Test laufen lassen**

Run (in `tools/`): `npm test`
Expected: FAIL mit `Cannot find module '../sync.mjs'`.

- [ ] **Step 4: Implementieren**

`tools/sync.mjs`:
```js
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readJSON, writeJSONIfChanged } from './lib/store.mjs';
import { mergeEntries } from './lib/merge.mjs';
import { parseBeholdFeed } from './lib/instagram.mjs';
import { processImage } from './lib/images.mjs';
import { parseYouTubeRss, isShort, rssUrl, thumbUrls } from './lib/youtube.mjs';
import { listManualFiles } from './lib/manual.mjs';

export const CHANNEL_ID = 'UCIxu3ooS7E4l_XP2ptHnZKw';

async function download(url, fetchFn) {
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function firstAvailable(urls, fetchFn) {
  let lastError;
  for (const url of urls) {
    try {
      return await download(url, fetchFn);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

function photoEntry(item, files, source) {
  return {
    id: item.id,
    source,
    date: item.date,
    caption: item.caption ?? '',
    permalink: item.permalink ?? null,
    src: `media/photos/${files.src}`,
    thumb: `media/photos/${files.thumb}`,
    w: files.w,
    h: files.h,
  };
}

async function collectInstagram({ beholdUrl, fetchFn, known, photoDir, errors, log }) {
  const added = [];
  if (!beholdUrl) {
    log.warn('BEHOLD_FEED_URL fehlt – Instagram wird übersprungen.');
    return added;
  }
  let items;
  try {
    const res = await fetchFn(beholdUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    items = parseBeholdFeed(await res.json());
  } catch (err) {
    errors.push(`Instagram: ${err.message}`);
    return added;
  }
  for (const item of items) {
    if (known.has(item.id)) continue;
    try {
      const files = await processImage(await download(item.imageUrl, fetchFn), item.id, photoDir);
      added.push(photoEntry(item, files, 'instagram'));
      known.add(item.id);
    } catch (err) {
      errors.push(`Instagram ${item.id}: ${err.message}`);
    }
  }
  return added;
}

async function collectManual({ manualDir, known, photoDir, errors }) {
  const added = [];
  for (const item of await listManualFiles(manualDir)) {
    if (known.has(item.id)) continue;
    try {
      const files = await processImage(item.file, item.id, photoDir);
      added.push(photoEntry(item, files, 'manual'));
      known.add(item.id);
    } catch (err) {
      errors.push(`Manuell ${item.id}: ${err.message}`);
    }
  }
  return added;
}

async function collectYouTube({ channelId, fetchFn, known, videoDir, errors }) {
  const added = [];
  let entries;
  try {
    const res = await fetchFn(rssUrl(channelId));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    entries = parseYouTubeRss(await res.text());
  } catch (err) {
    errors.push(`YouTube: ${err.message}`);
    return added;
  }
  for (const video of entries) {
    if (known.has(video.id)) continue;
    try {
      if (await isShort(video.id, fetchFn)) continue;
      const files = await processImage(await firstAvailable(thumbUrls(video.id), fetchFn), `yt_${video.id}`, videoDir);
      added.push({
        id: video.id,
        title: video.title,
        date: video.date,
        thumb: `media/videos/${files.src}`,
        thumbSmall: `media/videos/${files.thumb}`,
      });
      known.add(video.id);
    } catch (err) {
      errors.push(`YouTube ${video.id}: ${err.message}`);
    }
  }
  return added;
}

export async function runSync({ root, beholdUrl, channelId = CHANNEL_ID, fetchFn = fetch, log = console }) {
  const photosFile = join(root, 'data', 'photos.json');
  const videosFile = join(root, 'data', 'videos.json');
  const photos = await readJSON(photosFile, []);
  const videos = await readJSON(videosFile, []);
  const errors = [];
  const photoDir = join(root, 'media', 'photos');
  const knownPhotos = new Set(photos.map((p) => p.id));

  const newPhotos = [
    ...(await collectInstagram({ beholdUrl, fetchFn, known: knownPhotos, photoDir, errors, log })),
    ...(await collectManual({ manualDir: join(root, 'manual'), known: knownPhotos, photoDir, errors })),
  ];
  const newVideos = await collectYouTube({
    channelId, fetchFn, known: new Set(videos.map((v) => v.id)), videoDir: join(root, 'media', 'videos'), errors,
  });

  const photosChanged = await writeJSONIfChanged(photosFile, mergeEntries(photos, newPhotos).list);
  const videosChanged = await writeJSONIfChanged(videosFile, mergeEntries(videos, newVideos).list);
  for (const message of errors) log.error(message);
  return { addedPhotos: newPhotos.length, addedVideos: newVideos.length, errors, changed: photosChanged || videosChanged };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const ci = Boolean(process.env.GITHUB_ACTIONS);
  const log = {
    info: (m) => console.log(m),
    warn: (m) => console.log(ci ? `::warning::${m}` : `WARNUNG: ${m}`),
    error: (m) => console.log(ci ? `::warning::${m}` : `FEHLER: ${m}`),
  };
  const result = await runSync({ root, beholdUrl: process.env.BEHOLD_FEED_URL, log });
  console.log(`Neue Bilder: ${result.addedPhotos} · neue Videos: ${result.addedVideos} · Probleme: ${result.errors.length}`);
}
```

Hinweis: Wenn `photos.json` bei einem neuen Root noch nicht existiert, schreibt der erste Lauf `[]`. Das ist eine gewollte Änderung (`changed: true`).

- [ ] **Step 5: Tests laufen lassen**

Run (in `tools/`): `npm test`
Expected: PASS (alle Dateien, 7 neue Tests).

- [ ] **Step 6: Echter Lauf gegen YouTube (ohne Behold)**

Run (in `tools/`): `node sync.mjs`
Expected: `WARNUNG: BEHOLD_FEED_URL fehlt …` und `Neue Bilder: 0 · neue Videos: N`. In `data/videos.json` stehen echte Videos, z. B. „Pfister Neon Touring …“. Aus Deutschland kann YouTube die Shorts-Prüfung auf eine Cookie-Seite umleiten, dann rutschen lokal auch Shorts durch. Auf GitHub (USA) passiert das nicht. Für den Commit `data/videos.json` und `media/` deshalb **nicht** übernehmen:

Run: `git checkout -- data/videos.json` und `rm -rf media`

- [ ] **Step 7: Commit**

```bash
git add tools/sync.mjs tools/test/sync.test.mjs data
git commit -m "feat(tools): Sync für Instagram, YouTube und manuelle Bilder"
```

---

### Task 7: Vendor-Dateien, Logo-SVG und Favicons

**Files:**
- Create: `tools/vendor.mjs`, `tools/trace-logo.mjs`, `vendor/**` (generiert), `assets/logo/logo.svg`, `assets/logo/favicon-64.png`, `assets/logo/apple-touch-icon.png` (generiert)

**Interfaces:**
- Produces: `vendor/gsap/gsap.min.js`, `vendor/gsap/ScrollTrigger.min.js`, `vendor/gsap/DrawSVGPlugin.min.js`, `vendor/lenis/lenis.min.js`, `vendor/fonts/{montserrat-200,montserrat-300,inter-400,inter-600}.woff2`. Außerdem `assets/logo/logo.svg` mit `viewBox="0 0 554 684"`, ohne `width`/`height`, mit `<path>`-Elementen der Klasse `logo-mark__path`.

- [ ] **Step 1: `tools/vendor.mjs` schreiben**

```js
import { copyFile, mkdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const nm = join(here, 'node_modules');

const required = [
  ['gsap/dist/gsap.min.js', 'vendor/gsap/gsap.min.js'],
  ['gsap/dist/ScrollTrigger.min.js', 'vendor/gsap/ScrollTrigger.min.js'],
  ['gsap/dist/DrawSVGPlugin.min.js', 'vendor/gsap/DrawSVGPlugin.min.js'],
  ['lenis/dist/lenis.min.js', 'vendor/lenis/lenis.min.js'],
  ['@fontsource/montserrat/files/montserrat-latin-200-normal.woff2', 'vendor/fonts/montserrat-200.woff2'],
  ['@fontsource/montserrat/files/montserrat-latin-300-normal.woff2', 'vendor/fonts/montserrat-300.woff2'],
  ['@fontsource/inter/files/inter-latin-400-normal.woff2', 'vendor/fonts/inter-400.woff2'],
  ['@fontsource/inter/files/inter-latin-600-normal.woff2', 'vendor/fonts/inter-600.woff2'],
];
const licenses = [
  ['@fontsource/montserrat/LICENSE', 'vendor/fonts/LICENSE-Montserrat.txt'],
  ['@fontsource/inter/LICENSE', 'vendor/fonts/LICENSE-Inter.txt'],
  ['lenis/LICENSE', 'vendor/lenis/LICENSE.txt'],
];

async function copy(from, to) {
  await mkdir(dirname(join(root, to)), { recursive: true });
  await copyFile(join(nm, from), join(root, to));
  console.log(`✓ ${to}`);
}

for (const [from, to] of required) await copy(from, to);
for (const [from, to] of licenses) {
  try {
    await access(join(nm, from));
    await copy(from, to);
  } catch {
    console.log(`– Lizenzdatei fehlt im Paket: ${from}`);
  }
}
```

- [ ] **Step 2: Ausführen und prüfen**

Run (in `tools/`): `npm run vendor`
Expected: 8 Häkchen bei den Pflichtdateien. Falls `lenis/dist/lenis.min.js` fehlt: `ls node_modules/lenis/dist` ausführen, die UMD-Datei suchen (sie setzt `window.Lenis`), die Zeile anpassen und den Pfad in dieser Planzeile mitkorrigieren.

- [ ] **Step 3: `tools/trace-logo.mjs` schreiben**

```js
import sharp from 'sharp';
import potrace from 'potrace';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logoDir = join(root, 'assets', 'logo');
const trace = promisify(potrace.trace);

const SOURCE = join(logoDir, 'logo-horizontal-black.png');
const CROP_LEFT = 1050; // rechts vom Trennstrich beginnt die Illustration

const meta = await sharp(SOURCE).metadata();
const width = meta.width - CROP_LEFT;
const mark = await sharp(SOURCE)
  .flatten({ background: '#ffffff' })
  .extract({ left: CROP_LEFT, top: 0, width, height: meta.height })
  .png()
  .toBuffer();

let svg = await trace(mark, { threshold: 140, turdSize: 6, optTolerance: 0.3, color: '#ffffff', background: 'transparent' });
svg = svg
  .replace(/\s(width|height)="[^"]*"/g, '')
  .replace('<svg ', `<svg viewBox="0 0 ${width} ${meta.height}" `)
  .replace(/viewBox="[^"]*"\s+viewBox=/, 'viewBox=')
  .replace(/<path /g, '<path class="logo-mark__path" ');
await writeFile(join(logoDir, 'logo.svg'), svg);
console.log(`✓ logo.svg (${width}×${meta.height})`);

const square = join(logoDir, 'logo-square-white.webp');
await sharp(square).resize(64, 64).png().toFile(join(logoDir, 'favicon-64.png'));
await sharp(square).resize(180, 180).png().toFile(join(logoDir, 'apple-touch-icon.png'));
console.log('✓ Favicons');
```

- [ ] **Step 4: Ausführen und visuell prüfen**

Run (in `tools/`): `npm run trace-logo`
Expected: `✓ logo.svg (554×684)` und `✓ Favicons`.
Danach `assets/logo/logo.svg` im Browser-Bereich öffnen (auf dunklem Hintergrund: `body{background:#000}` notfalls über die DevTools) und prüfen: Haarknoten, Brille und Hand sind erkennbar, es gibt keine Reste des Trennstrichs am linken Rand und genau **ein** `viewBox`-Attribut. Ist der Trennstrich sichtbar, `CROP_LEFT` um 20 erhöhen und wiederholen. Sind Details zu grob, `turdSize` auf 2 senken.

- [ ] **Step 5: Commit**

```bash
git add tools/vendor.mjs tools/trace-logo.mjs vendor assets/logo
git commit -m "build: GSAP, Lenis und Schriften lokal einbinden, Logo als SVG"
```

---

### Task 8: Frontend-Datenhelfer

**Files:**
- Create: `js/package.json`, `js/data.js`
- Test: `tools/test/data.test.mjs`

**Interfaces:**
- Produces: `dataBase(search?: string): 'data/'|'dev-data/'`, `loadJSON(url, fallback)`, `visible(list, hiddenIds): Entry[]`, `firstPage(list, pages, size)`, `altText(caption, fallback?)`, `pad(n): string`, `tileSize(w, h): 'wide'|'tall'|'std'`

- [ ] **Step 1: `js/package.json` anlegen** (damit Node die Browser-Module als ESM lädt)

```json
{ "type": "module" }
```

- [ ] **Step 2: Fehlschlagenden Test schreiben**

`tools/test/data.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visible, firstPage, altText, pad, tileSize, dataBase } from '../../js/data.js';

test('visible filtert ausgeblendete und kaputte Einträge', () => {
  const list = [{ id: 'a' }, { id: 'b' }, null, { foo: 1 }];
  assert.deepEqual(visible(list, ['b']), [{ id: 'a' }]);
  assert.deepEqual(visible(null, ['a']), []);
  assert.deepEqual(visible([{ id: 'a' }], undefined), [{ id: 'a' }]);
  assert.deepEqual(visible({}, []), []);
});

test('firstPage liefert kumulativ Seiten', () => {
  const list = Array.from({ length: 50 }, (_, i) => i);
  assert.equal(firstPage(list, 1, 24).length, 24);
  assert.equal(firstPage(list, 3, 24).length, 50);
  assert.equal(firstPage(list, 0, 24).length, 24);
});

test('altText entfernt Hashtags/Mentions, kürzt und hat Fallback', () => {
  assert.equal(altText('Sommer Shooting 🌅 #gta #rp @bauer_rp'), 'Sommer Shooting 🌅');
  assert.equal(altText('#nur #tags'), 'Foto von Bauer Produktion');
  assert.equal(altText(undefined), 'Foto von Bauer Produktion');
  assert.equal(altText('<img src=x onerror=alert(1)>'), '<img src=x onerror=alert(1)>');
  const long = altText('a'.repeat(300));
  assert.equal(long.length, 120);
  assert.ok(long.endsWith('…'));
});

test('pad, tileSize, dataBase', () => {
  assert.equal(pad(4), '04');
  assert.equal(pad(12), '12');
  assert.equal(tileSize(1600, 900), 'wide');
  assert.equal(tileSize(1080, 1350), 'tall');
  assert.equal(tileSize(1000, 1000), 'std');
  assert.equal(tileSize(undefined, 10), 'std');
  assert.equal(dataBase('?dev'), 'dev-data/');
  assert.equal(dataBase(''), 'data/');
});
```

(Der `<img …>`-Fall dokumentiert: `altText` lässt Text unverändert, er wird **nur** über `alt`/`textContent` gesetzt, nie als HTML.)

- [ ] **Step 3: Test laufen lassen**

Run (in `tools/`): `npm test`
Expected: FAIL mit `Cannot find module '../../js/data.js'`.

- [ ] **Step 4: Implementieren**

`js/data.js`:
```js
export function dataBase(search = globalThis.location?.search ?? '') {
  return new URLSearchParams(search).has('dev') ? 'dev-data/' : 'data/';
}

export async function loadJSON(url, fallback = null) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

export function visible(list, hiddenIds = []) {
  if (!Array.isArray(list)) return [];
  const hidden = new Set(Array.isArray(hiddenIds) ? hiddenIds : []);
  return list.filter((item) => item && typeof item.id === 'string' && !hidden.has(item.id));
}

export function firstPage(list, pages, size) {
  return list.slice(0, Math.max(1, pages) * size);
}

export function altText(caption, fallback = 'Foto von Bauer Produktion') {
  if (typeof caption !== 'string') return fallback;
  const text = caption
    .replace(/#[\p{L}\p{N}_]+/gu, '')
    .replace(/@[\w.]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return fallback;
  return text.length > 120 ? `${text.slice(0, 119).trimEnd()}…` : text;
}

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function tileSize(w, h) {
  if (!w || !h) return 'std';
  const ratio = w / h;
  if (ratio >= 1.3) return 'wide';
  if (ratio <= 0.85) return 'tall';
  return 'std';
}
```

Hinweis zum Kürzen: Ist das 119. Zeichen ein Leerzeichen, wird es entfernt und das Ergebnis ist kürzer als 120. Der Test nutzt `'a'.repeat(300)`, damit gilt exakt 120.

- [ ] **Step 5: Tests laufen lassen**

Run (in `tools/`): `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/package.json js/data.js tools/test/data.test.mjs
git commit -m "feat(web): Datenhelfer für Laden, Filtern und Alt-Texte"
```

---

### Task 9: Seitengerüst, Gestaltung und lokale Testdaten

**Files:**
- Create: `index.html`, `datenschutz.html`, `css/fonts.css`, `css/style.css`, `tools/dev-seed.mjs`, `.claude/launch.json`

**Interfaces:**
- Produces (DOM-Verträge für Task 10–13): `[data-nav]`, `[data-nav-toggle]`, `[data-nav-menu]`, `[data-section="neueste|archiv|videos"]`, `[data-section-link="neueste|videos"]`, `[data-hero-bg]`, `[data-logo]`, `[data-hero-word]`, `[data-hero-sub]`, `.hero__title`, `.hero__rule`, `.hero__claim`, `.hero__scroll`, `[data-strip-track]`, `.strip__viewport`, `.strip__pin`, `[data-strip-progress]`, `[data-strip-current]`, `[data-strip-total]`, `[data-archive-grid]`, `[data-archive-more]`, `[data-video-stack]`, `[data-service]`, `[data-count]`, `[data-reveal]`, `[data-copy]` + `[data-copy-status]`, `[data-lightbox]` mit `[data-lb-img]`, `[data-lb-caption]`, `[data-lb-link]`, `[data-lb-counter]`, `[data-lb-flash]`, `[data-lb-prev]`, `[data-lb-next]`, `[data-lb-close]`
- Produces: `dev-data/photos.json`, `dev-data/videos.json`, `dev-data/hidden.json` (lokal, gitignored)

- [ ] **Step 1: `css/fonts.css`**

```css
@font-face { font-family: 'Montserrat'; font-weight: 200; font-style: normal; font-display: swap; src: url('../vendor/fonts/montserrat-200.woff2') format('woff2'); }
@font-face { font-family: 'Montserrat'; font-weight: 300; font-style: normal; font-display: swap; src: url('../vendor/fonts/montserrat-300.woff2') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 400; font-style: normal; font-display: swap; src: url('../vendor/fonts/inter-400.woff2') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 600; font-style: normal; font-display: swap; src: url('../vendor/fonts/inter-600.woff2') format('woff2'); }
```

- [ ] **Step 2: `css/style.css`**

```css
:root {
  --bg: #000;
  --fg: #fff;
  --muted: #9a9a9a;
  --line: rgba(255, 255, 255, .14);
  --font-display: 'Montserrat', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Consolas, monospace;
  --gutter: clamp(16px, 4vw, 56px);
  --max: 1440px;
  --nav-h: 64px;
  --ease: cubic-bezier(.65, 0, .35, 1);
}

*, *::before, *::after { box-sizing: border-box; }
html { background: var(--bg); color: var(--fg); -webkit-text-size-adjust: 100%; }
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }
body { margin: 0; font-family: var(--font-body); font-size: 16px; line-height: 1.6; background: var(--bg); overflow-x: hidden; }
img { display: block; max-width: 100%; height: auto; }
a { color: inherit; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
:focus-visible { outline: 1px solid var(--fg); outline-offset: 4px; }
[hidden] { display: none !important; }
.skip { position: absolute; left: -9999px; top: 8px; z-index: 100; background: var(--fg); color: var(--bg); padding: 8px 12px; }
.skip:focus { left: 8px; }

/* Filmkorn */
.grain {
  position: fixed; inset: -50%; z-index: 90; pointer-events: none; opacity: .07;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grain 1s steps(6) infinite;
}
@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-5%, 3%); }
  40% { transform: translate(3%, -4%); }
  60% { transform: translate(-2%, 5%); }
  80% { transform: translate(4%, 2%); }
}

/* Typografie & Grundbausteine */
.display { font-family: var(--font-display); font-weight: 200; text-transform: uppercase; letter-spacing: .16em; line-height: 1.05; font-size: clamp(2rem, 6vw, 5.5rem); margin: 0; }
.eyebrow { display: block; font-family: var(--font-display); font-weight: 300; font-size: .7rem; letter-spacing: .45em; text-transform: uppercase; color: var(--muted); margin-bottom: 1rem; }
.section { padding: clamp(80px, 14vh, 160px) var(--gutter); max-width: var(--max); margin: 0 auto; }
.section-head { margin-bottom: clamp(32px, 6vh, 64px); }
.btn { display: inline-block; font-family: var(--font-display); font-size: .75rem; letter-spacing: .35em; text-transform: uppercase; padding: 1rem 2rem; border: 1px solid var(--fg); text-decoration: none; transition: background .3s, color .3s; }
.btn:hover { background: var(--fg); color: var(--bg); }
.char { display: inline-block; }

/* Navigation */
.nav { position: fixed; inset: 0 0 auto; z-index: 50; height: var(--nav-h); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--gutter); mix-blend-mode: difference; transition: transform .5s var(--ease); }
.nav--hidden { transform: translateY(-100%); }
.nav__brand { font-family: var(--font-display); font-weight: 300; letter-spacing: .4em; text-decoration: none; }
.nav__menu { display: flex; gap: 2rem; }
.nav__menu a { font-family: var(--font-display); font-size: .7rem; letter-spacing: .3em; text-transform: uppercase; text-decoration: none; opacity: .75; transition: opacity .2s; }
.nav__menu a:hover, .nav__menu a[aria-current="page"] { opacity: 1; }
.nav__toggle { display: none; font-family: var(--font-display); font-size: .7rem; letter-spacing: .3em; text-transform: uppercase; }
@media (max-width: 860px) {
  .nav { mix-blend-mode: normal; background: linear-gradient(#000c, #0000); }
  .nav__toggle { display: block; position: relative; z-index: 2; }
  .nav__menu { position: fixed; inset: 0; flex-direction: column; justify-content: center; align-items: center; gap: 1.5rem; background: var(--bg); opacity: 0; visibility: hidden; transition: opacity .4s, visibility .4s; }
  .nav__menu a { font-size: 1.4rem; opacity: 1; }
  .nav--open .nav__menu { opacity: 1; visibility: visible; }
}

/* Hero */
.hero { position: relative; min-height: 100svh; display: grid; place-items: center; text-align: center; padding: var(--nav-h) var(--gutter); overflow: hidden; }
.hero__bg { position: absolute; inset: 0; opacity: .18; background-size: cover; background-position: center; transform: scale(1.1); }
.hero__bg::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 50% 45%, transparent 0, var(--bg) 75%); }
.hero__inner { position: relative; display: grid; justify-items: center; gap: 1.5rem; }
.hero__logo { width: min(42vw, 260px); aspect-ratio: 554 / 684; }
.hero__logo svg, .hero__logo img { width: 100%; height: 100%; object-fit: contain; }
.hero__title { margin: 0; font-family: var(--font-display); font-weight: 200; text-transform: uppercase; line-height: 1; }
.hero__word { display: block; font-size: clamp(3rem, 11vw, 8.5rem); letter-spacing: .2em; margin-right: -.2em; }
.hero__sub { display: block; font-size: clamp(.9rem, 2.4vw, 1.6rem); letter-spacing: .85em; margin-right: -.85em; margin-top: .6em; }
.hero__rule { width: min(70vw, 520px); height: 1px; background: var(--fg); }
.hero__claim { margin: 0; color: var(--muted); letter-spacing: .08em; }
.hero__scroll { position: absolute; bottom: 28px; left: 50%; translate: -50% 0; font-family: var(--font-display); font-size: .65rem; letter-spacing: .4em; text-transform: uppercase; text-decoration: none; color: var(--muted); }
.hero__scroll::after { content: ""; display: block; width: 1px; height: 40px; margin: 10px auto 0; background: var(--fg); transform-origin: top; animation: scrollcue 2s var(--ease) infinite; }
@keyframes scrollcue { 0% { transform: scaleY(0); } 50% { transform: scaleY(1); } 100% { transform: scaleY(0) translateY(40px); } }
.js .hero [data-hero-reveal], .js .hero__logo img { visibility: hidden; }
.js-ready .hero [data-hero-reveal], .js-ready .hero__logo img { visibility: visible; }

/* Filmstreifen */
.strip__pin { min-height: 100svh; display: flex; flex-direction: column; justify-content: center; padding: calc(var(--nav-h) + 24px) 0 40px; overflow: hidden; }
.strip .section-head { padding: 0 var(--gutter); margin-bottom: 32px; }
.strip__viewport { overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; padding: 0 var(--gutter); }
.strip__viewport::-webkit-scrollbar { display: none; }
.strip--pinned .strip__viewport { overflow: visible; scroll-snap-type: none; }
.strip__track { list-style: none; margin: 0; padding: 0; display: flex; gap: clamp(12px, 2vw, 28px); width: max-content; }
.strip__item { flex: none; scroll-snap-align: start; height: min(58svh, 560px); }
.strip__item:nth-child(even) { margin-top: 6svh; height: min(48svh, 460px); }
.strip__item button { display: block; height: 100%; padding: 0; }
.strip__item img { height: 100%; width: auto; object-fit: cover; }
.strip__meta { display: flex; align-items: center; gap: 24px; padding: 28px var(--gutter) 0; }
.strip__bar { flex: 1; height: 1px; background: var(--line); position: relative; overflow: hidden; }
.strip__bar span { position: absolute; inset: 0; background: var(--fg); transform-origin: left; transform: scaleX(0); }
.strip__count { margin: 0; font-family: var(--font-display); font-weight: 200; font-size: clamp(1.8rem, 4vw, 3rem); letter-spacing: .1em; }
.strip__count small { font-size: .4em; color: var(--muted); }

/* Archiv-Raster */
.archive__grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(6, 1fr); grid-auto-flow: dense; grid-auto-rows: clamp(110px, 13vw, 210px); gap: clamp(8px, 1.2vw, 18px); }
.archive__item { position: relative; overflow: hidden; grid-column: span 2; grid-row: span 2; }
.archive__item--wide { grid-column: span 4; grid-row: span 2; }
.archive__item--tall { grid-column: span 2; grid-row: span 3; }
.archive__item button { display: block; width: 100%; height: 100%; padding: 0; }
.archive__item img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s var(--ease); }
.archive__item:hover img { transform: scale(1.05); }
.archive__item::before, .archive__item::after { content: ""; position: absolute; z-index: 1; width: 18px; height: 18px; border: 0 solid var(--fg); opacity: 0; pointer-events: none; transition: opacity .3s, top .4s var(--ease), left .4s var(--ease), bottom .4s var(--ease), right .4s var(--ease); }
.archive__item::before { top: 18px; left: 18px; border-width: 1px 0 0 1px; }
.archive__item::after { bottom: 18px; right: 18px; border-width: 0 1px 1px 0; }
.archive__item:hover::before, .archive__item:hover::after, .archive__item:focus-within::before, .archive__item:focus-within::after { opacity: 1; }
.archive__item:hover::before { top: 10px; left: 10px; }
.archive__item:hover::after { bottom: 10px; right: 10px; }
.archive__more { display: block; margin: 48px auto 0; }
@media (max-width: 700px) {
  .archive__grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 42vw; }
  .archive__item { grid-column: span 1; grid-row: span 1; }
  .archive__item--wide { grid-column: span 2; grid-row: span 1; }
  .archive__item--tall { grid-column: span 1; grid-row: span 2; }
}

/* Großansicht */
.lightbox { width: 100vw; height: 100svh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: var(--bg); color: var(--fg); }
.lightbox::backdrop { background: var(--bg); }
.lightbox__figure { margin: 0; height: 100%; display: grid; grid-template-rows: 1fr auto; place-items: center; padding: 64px 72px 24px; }
.lightbox__img { max-width: 100%; max-height: calc(100svh - 150px); width: auto; height: auto; object-fit: contain; }
.lightbox__caption { display: flex; flex-wrap: wrap; gap: 8px 24px; align-items: center; justify-content: center; font-size: .8rem; color: var(--muted); padding-top: 16px; max-width: 70ch; text-align: center; }
.lightbox__caption a { text-decoration: none; letter-spacing: .25em; text-transform: uppercase; font-size: .7rem; }
.lightbox__btn { position: absolute; font-family: var(--font-display); font-size: .7rem; letter-spacing: .3em; text-transform: uppercase; padding: 16px; }
.lightbox__close { top: 12px; right: 12px; }
.lightbox__prev { left: 8px; top: 50%; translate: 0 -50%; }
.lightbox__next { right: 8px; top: 50%; translate: 0 -50%; }
.lightbox__counter { position: absolute; top: 24px; left: 24px; font-family: var(--font-display); font-weight: 200; letter-spacing: .1em; }
.flash { position: absolute; inset: 0; background: var(--fg); pointer-events: none; opacity: 0; }
.flash--fire { animation: flash .45s ease-out; }
@keyframes flash { 0% { opacity: .9; } 100% { opacity: 0; } }
@media (max-width: 700px) {
  .lightbox__figure { padding: 56px 12px 64px; }
  .lightbox__prev, .lightbox__next { top: auto; bottom: 8px; translate: none; }
}

/* Videos */
.videos .section { padding-bottom: 0; }
.videos__stack { position: relative; }
.vcard { position: sticky; top: 0; height: 100svh; display: grid; align-items: end; overflow: hidden; background: var(--bg); }
.vcard__media { position: absolute; inset: 0; transform-origin: center top; }
.vcard__media img { width: 100%; height: 100%; object-fit: cover; opacity: .75; }
.vcard__media::after { content: ""; position: absolute; inset: 0; background: linear-gradient(transparent 40%, #000e); }
.vcard__body { position: relative; padding: var(--gutter); padding-bottom: clamp(40px, 8vh, 96px); max-width: 900px; }
.vcard__index { font-family: var(--font-display); font-size: .7rem; letter-spacing: .45em; color: var(--muted); }
.vcard__title { font-family: var(--font-display); font-weight: 200; font-size: clamp(1.5rem, 4vw, 3.4rem); letter-spacing: .06em; line-height: 1.15; margin: .4em 0 .8em; }
.vcard__play { display: inline-flex; align-items: center; gap: 14px; font-family: var(--font-display); font-size: .75rem; letter-spacing: .35em; text-transform: uppercase; }
.vcard__play span[aria-hidden] { display: grid; place-items: center; width: 64px; height: 64px; border: 1px solid var(--fg); border-radius: 50%; transition: background .3s, color .3s; }
.vcard__play:hover span[aria-hidden] { background: var(--fg); color: var(--bg); }
.vcard__frame { position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; border: 0; background: var(--bg); }
.videos__note { font-size: .75rem; color: var(--muted); margin: 0; }

/* Leistungen */
.services__list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
.services__row { display: grid; grid-template-columns: 80px 1fr 1.2fr; gap: 24px; align-items: baseline; padding: clamp(24px, 4vh, 44px) 0; border-bottom: 1px solid var(--line); }
.services__num { font-family: var(--font-display); font-size: .75rem; letter-spacing: .3em; color: var(--muted); }
.services__name { font-family: var(--font-display); font-weight: 200; text-transform: uppercase; letter-spacing: .12em; font-size: clamp(1.8rem, 5vw, 4rem); margin: 0; transition: letter-spacing .6s var(--ease); }
.services__row:hover .services__name { letter-spacing: .2em; }
.services__text { margin: 0; color: var(--muted); }
.services__preview { position: fixed; top: 0; left: 0; z-index: 40; width: 260px; aspect-ratio: 4 / 5; object-fit: cover; pointer-events: none; opacity: 0; translate: var(--x, 0) var(--y, 0); transform: translate(-50%, -50%) scale(.8); transition: opacity .3s, transform .3s; }
.services__preview--on { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.notice { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 56px; }
.notice__box { border: 1px solid var(--line); padding: 28px; }
.notice__box h3 { font-family: var(--font-display); font-weight: 300; font-size: .8rem; letter-spacing: .35em; text-transform: uppercase; margin: 0 0 12px; }
.notice__box p { margin: 0; color: var(--muted); font-size: .95rem; }
@media (max-width: 700px) { .services__row { grid-template-columns: 1fr; gap: 8px; } }

/* Über */
.about { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(32px, 6vw, 96px); align-items: end; }
.about__text { font-family: var(--font-display); font-weight: 200; font-size: clamp(1.4rem, 3vw, 2.4rem); line-height: 1.35; margin: 0; }
.about__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin: 0; }
.about__stats div { display: flex; flex-direction: column-reverse; border-top: 1px solid var(--line); padding-top: 16px; }
.about__stats dt { font-size: .7rem; letter-spacing: .3em; text-transform: uppercase; color: var(--muted); }
.about__stats dd { margin: 0; font-family: var(--font-display); font-weight: 200; font-size: clamp(2rem, 4vw, 3.4rem); }
@media (max-width: 800px) { .about { grid-template-columns: 1fr; } }

/* Terminal (Scripts) */
.terminal { display: block; text-decoration: none; border: 1px solid var(--line); background: #050505; font-family: var(--font-mono); font-size: clamp(.85rem, 1.6vw, 1.05rem); transition: border-color .3s; }
a.terminal:hover { border-color: var(--fg); }
.terminal__bar { display: flex; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
.terminal__bar span { width: 10px; height: 10px; border-radius: 50%; background: #333; }
.terminal__body { margin: 0; padding: clamp(20px, 4vw, 40px); white-space: pre-wrap; color: #d8d8d8; }
.terminal__prompt { color: var(--fg); }
.terminal__cursor { display: inline-block; width: .6em; height: 1.1em; background: var(--fg); vertical-align: text-bottom; animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }

/* Kontakt */
.contact__title { font-size: clamp(2.2rem, 8vw, 7rem); }
.contact__list { list-style: none; margin: 56px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); column-gap: 32px; border-top: 1px solid var(--line); }
.contact__item { border-bottom: 1px solid var(--line); }
.contact__link { display: flex; flex-direction: column; gap: 6px; width: 100%; text-align: left; padding: 28px 0; text-decoration: none; transition: padding .4s var(--ease); }
.contact__link:hover { padding-left: 16px; }
.contact__label { font-size: .7rem; letter-spacing: .35em; text-transform: uppercase; color: var(--muted); }
.contact__value { font-family: var(--font-display); font-weight: 300; font-size: clamp(1rem, 1.8vw, 1.35rem); overflow-wrap: anywhere; }
.contact__status { font-size: .75rem; color: var(--muted); min-height: 1.2em; }

/* Footer */
.footer { display: flex; flex-wrap: wrap; gap: 24px; justify-content: space-between; align-items: center; padding: 40px var(--gutter); border-top: 1px solid var(--line); font-size: .8rem; color: var(--muted); }
.footer img { width: 160px; height: auto; }
.footer a { text-decoration: none; }
.footer a:hover { color: var(--fg); }

/* Unterseiten */
.page-hero { padding: calc(var(--nav-h) + 12vh) var(--gutter) 6vh; max-width: var(--max); margin: 0 auto; }
.page-hero p { color: var(--muted); max-width: 60ch; }
.scripts__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
.script-card { display: flex; flex-direction: column; border: 1px solid var(--line); background: #050505; }
.script-card img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.script-card__body { display: flex; flex-direction: column; gap: 12px; flex: 1; padding: 24px; }
.script-card h2 { font-family: var(--font-mono); font-size: 1.1rem; margin: 0; }
.script-card p { margin: 0; color: #cfcfcf; }
.script-card ul { margin: 0; padding-left: 1.1em; color: var(--muted); font-size: .9rem; }
.script-card .btn { margin-top: auto; align-self: flex-start; }
.legal { max-width: 760px; }
.legal h2 { font-family: var(--font-display); font-weight: 300; letter-spacing: .2em; text-transform: uppercase; font-size: .9rem; margin: 2.5em 0 .8em; }
.legal p { color: #cfcfcf; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  .grain { animation: none; }
}
```

- [ ] **Step 3: `index.html`**

```html
<!doctype html>
<html lang="de" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bauer Produktion – Roleplay in Szene gesetzt</title>
  <meta name="description" content="Bauer Produktion – privates Roleplay-Fotostudio für GTA RP. Shootings, Edits, Stories und Videos. Jede Rolle verdient ihr Bild.">
  <meta name="theme-color" content="#000000">
  <meta property="og:title" content="Bauer Produktion">
  <meta property="og:description" content="Roleplay in Szene gesetzt. Jede Rolle verdient ihr Bild.">
  <meta property="og:image" content="assets/logo/logo-square-white.webp">
  <link rel="icon" type="image/png" href="assets/logo/favicon-64.png">
  <link rel="apple-touch-icon" href="assets/logo/apple-touch-icon.png">
  <link rel="preload" href="vendor/fonts/montserrat-200.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/style.css">
  <script>
    document.documentElement.classList.replace('no-js', 'js');
    setTimeout(function () { document.documentElement.classList.add('js-ready'); }, 3000);
  </script>
</head>
<body>
  <a class="skip" href="#main">Zum Inhalt springen</a>
  <div class="grain" aria-hidden="true"></div>

  <header class="nav" data-nav>
    <a class="nav__brand" href="./" aria-label="Bauer Produktion – Startseite">BAUER</a>
    <button class="nav__toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="nav-menu">Menü</button>
    <nav id="nav-menu" class="nav__menu" data-nav-menu aria-label="Hauptnavigation">
      <a href="#neueste" data-section-link="neueste">Portfolio</a>
      <a href="#videos" data-section-link="videos">Videos</a>
      <a href="#leistungen">Leistungen</a>
      <a href="#ueber">Über</a>
      <a href="scripts.html">Scripts</a>
      <a href="#kontakt">Kontakt</a>
    </nav>
  </header>

  <main id="main">
    <section class="hero" id="top" aria-label="Intro">
      <div class="hero__bg" data-hero-bg aria-hidden="true"></div>
      <div class="hero__inner">
        <div class="hero__logo" data-logo>
          <img src="assets/logo/logo-square-white.webp" alt="" width="1254" height="1254">
        </div>
        <h1 class="hero__title" data-hero-reveal>
          <span class="hero__word" data-hero-word>Bauer</span>
          <span class="hero__sub" data-hero-sub>Produktion</span>
        </h1>
        <div class="hero__rule" data-hero-reveal aria-hidden="true"></div>
        <p class="hero__claim" data-hero-reveal>Jede Rolle verdient ihr Bild.</p>
      </div>
      <a class="hero__scroll" href="#neueste" data-hero-reveal>Scrollen</a>
    </section>

    <section class="strip" id="neueste" data-section="neueste" aria-labelledby="neueste-title">
      <div class="strip__pin">
        <header class="section-head">
          <span class="eyebrow">01 · Portfolio</span>
          <h2 id="neueste-title" class="display">Neueste Shootings</h2>
        </header>
        <div class="strip__viewport">
          <ul class="strip__track" data-strip-track></ul>
        </div>
        <div class="strip__meta" aria-hidden="true">
          <div class="strip__bar"><span data-strip-progress></span></div>
          <p class="strip__count"><span data-strip-current>01</span><small> / <span data-strip-total>00</span></small></p>
        </div>
      </div>
    </section>

    <section class="section archive" id="archiv" data-section="archiv" aria-labelledby="archiv-title">
      <header class="section-head" data-reveal>
        <span class="eyebrow">02 · Archiv</span>
        <h2 id="archiv-title" class="display">Alle Arbeiten</h2>
      </header>
      <ul class="archive__grid" data-archive-grid></ul>
      <button class="btn archive__more" type="button" data-archive-more hidden>Mehr laden</button>
    </section>

    <section class="videos" id="videos" data-section="videos" aria-labelledby="videos-title">
      <div class="section">
        <header class="section-head" data-reveal>
          <span class="eyebrow">03 · Video-Projekte</span>
          <h2 id="videos-title" class="display">In Bewegung</h2>
        </header>
        <p class="videos__note">Videos werden erst nach Klick auf „Abspielen“ von YouTube geladen.</p>
      </div>
      <div class="videos__stack" data-video-stack></div>
    </section>

    <section class="section" id="leistungen" aria-labelledby="leistungen-title">
      <header class="section-head" data-reveal>
        <span class="eyebrow">04 · Leistungen</span>
        <h2 id="leistungen-title" class="display">Was ich mache</h2>
      </header>
      <ul class="services__list">
        <li class="services__row" data-service data-reveal>
          <span class="services__num">01</span>
          <h3 class="services__name">Shootings</h3>
          <p class="services__text">Deine Figur, dein Moment. Ob Porträt, Paar, Crew oder Fahrzeug – ich setze deine Rolle in Szene.</p>
        </li>
        <li class="services__row" data-service data-reveal>
          <span class="services__num">02</span>
          <h3 class="services__name">Edits</h3>
          <p class="services__text">Farblook, Retusche, Atmosphäre. Aus einem guten Screenshot wird ein Bild mit Geschichte.</p>
        </li>
        <li class="services__row" data-service data-reveal>
          <span class="services__num">03</span>
          <h3 class="services__name">Stories &amp; Videos</h3>
          <p class="services__text">Kurze Clips, Carporn, Ankündigungen und Trailer für Projekte, Fraktionen und Firmen.</p>
        </li>
      </ul>
      <div class="notice">
        <div class="notice__box" data-reveal>
          <h3>Privat &amp; ohne feste Preise</h3>
          <p>Bauer Produktion ist ein privates Hobbyprojekt. Es gibt keine festen Preise. Über eine freiwillige Aufwandsentschädigung freue ich mich, sie ist aber kein Muss.</p>
        </div>
        <div class="notice__box" data-reveal>
          <h3>Bildrechte</h3>
          <p>Alle Fotos und Videos werden von Bauer Produktion erstellt, die Urheberrechte bleiben bei Bauer Produktion. Du darfst deine Bilder für dein Roleplay nutzen, etwa auf Social Media, in Discord oder auf deinem Server, wenn du <strong>@bauer_rp</strong> als Quelle nennst. Weiterverkauf, das Ausgeben als eigene Arbeit oder das Entfernen der Kennzeichnung ist nicht erlaubt. Bauer Produktion darf alle Aufnahmen im eigenen Portfolio und auf Social Media zeigen.</p>
        </div>
      </div>
    </section>

    <section class="section" id="ueber" aria-labelledby="ueber-title">
      <header class="section-head" data-reveal>
        <span class="eyebrow">05 · Über</span>
        <h2 id="ueber-title" class="display">Bauer Produktion</h2>
      </header>
      <div class="about">
        <p class="about__text" data-reveal>Hinter Bauer Produktion steckt die Leidenschaft, Roleplay so festzuhalten, wie es sich anfühlt: filmisch, nah und mit Charakter. Jede Rolle verdient ihr Bild.</p>
        <dl class="about__stats" data-reveal>
          <div><dt>Follower</dt><dd data-count="690" data-suffix="+">690+</dd></div>
          <div><dt>Bilder im Archiv</dt><dd data-count="photos">–</dd></div>
          <div><dt>Videos</dt><dd data-count="videos">–</dd></div>
        </dl>
      </div>
    </section>

    <section class="section" id="scripts-teaser" aria-labelledby="scripts-title">
      <header class="section-head" data-reveal>
        <span class="eyebrow">06 · Nebenbei</span>
        <h2 id="scripts-title" class="display">Scripts</h2>
      </header>
      <a class="terminal" href="scripts.html" data-reveal>
        <div class="terminal__bar" aria-hidden="true"><span></span><span></span><span></span></div>
        <p class="terminal__body"><span class="terminal__prompt">bauer@produktion:~$</span> ls ./fivem-scripts
Eigene FiveM-Scripts aus der Werkstatt.
→ Zur Scripts-Seite <span class="terminal__cursor" aria-hidden="true"></span></p>
      </a>
    </section>

    <section class="section" id="kontakt" aria-labelledby="kontakt-title">
      <span class="eyebrow">07 · Kontakt</span>
      <h2 id="kontakt-title" class="display contact__title" data-reveal>Lass uns deine Rolle in Szene setzen.</h2>
      <ul class="contact__list">
        <li class="contact__item">
          <button class="contact__link" type="button" data-copy="dominikbauer">
            <span class="contact__label">Discord</span>
            <span class="contact__value">dominikbauer</span>
            <span class="contact__status" data-copy-status aria-live="polite">Klicken zum Kopieren</span>
          </button>
        </li>
        <li class="contact__item">
          <a class="contact__link" href="https://www.instagram.com/bauer_rp/" target="_blank" rel="noopener">
            <span class="contact__label">Instagram</span>
            <span class="contact__value">@bauer_rp</span>
          </a>
        </li>
        <li class="contact__item">
          <a class="contact__link" href="https://www.youtube.com/@bauerproduktion" target="_blank" rel="noopener">
            <span class="contact__label">YouTube</span>
            <span class="contact__value">@bauerproduktion</span>
          </a>
        </li>
        <li class="contact__item">
          <a class="contact__link" href="mailto:bauer.produktion.247@gmail.com">
            <span class="contact__label">E-Mail</span>
            <span class="contact__value">bauer.produktion.247@gmail.com</span>
          </a>
        </li>
      </ul>
    </section>
  </main>

  <footer class="footer">
    <img src="assets/logo/logo-horizontal-white.webp" alt="Bauer Produktion" width="2000" height="667" loading="lazy">
    <a href="datenschutz.html">Datenschutz</a>
    <span>© Bauer Produktion</span>
  </footer>

  <dialog class="lightbox" data-lightbox aria-label="Bild-Großansicht">
    <div class="flash" data-lb-flash aria-hidden="true"></div>
    <span class="lightbox__counter" data-lb-counter></span>
    <button class="lightbox__btn lightbox__close" type="button" data-lb-close>Schließen</button>
    <button class="lightbox__btn lightbox__prev" type="button" data-lb-prev aria-label="Vorheriges Bild">←</button>
    <button class="lightbox__btn lightbox__next" type="button" data-lb-next aria-label="Nächstes Bild">→</button>
    <figure class="lightbox__figure">
      <img class="lightbox__img" data-lb-img alt="">
      <figcaption class="lightbox__caption">
        <span data-lb-caption></span>
        <a data-lb-link href="#" target="_blank" rel="noopener" hidden>Auf Instagram ansehen ↗</a>
      </figcaption>
    </figure>
  </dialog>

  <script src="vendor/gsap/gsap.min.js" defer></script>
  <script src="vendor/gsap/ScrollTrigger.min.js" defer></script>
  <script src="vendor/gsap/DrawSVGPlugin.min.js" defer></script>
  <script src="vendor/lenis/lenis.min.js" defer></script>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

Hinweis: Module laufen nach den `defer`-Scripts, deshalb sind `window.gsap` usw. in `main.js` bereits gesetzt. `js/main.js` entsteht in Task 10. Bis dahin liefert der Browser für diese Datei einen 404, das ist erwartet.

- [ ] **Step 4: `datenschutz.html`**

```html
<!doctype html>
<html lang="de" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Datenschutz – Bauer Produktion</title>
  <meta name="robots" content="noindex">
  <link rel="icon" type="image/png" href="assets/logo/favicon-64.png">
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="nav">
    <a class="nav__brand" href="./">BAUER</a>
    <nav class="nav__menu" aria-label="Hauptnavigation" style="position:static;opacity:1;visibility:visible;flex-direction:row;background:none">
      <a href="./">Zurück zur Startseite</a>
    </nav>
  </header>
  <main class="page-hero legal" id="main">
    <span class="eyebrow">Rechtliches</span>
    <h1 class="display">Datenschutz</h1>

    <h2>Verantwortlich</h2>
    <p>Bauer Produktion (privates, nicht-kommerzielles Hobbyprojekt)<br>E-Mail: <a href="mailto:bauer.produktion.247@gmail.com">bauer.produktion.247@gmail.com</a></p>

    <h2>Hosting</h2>
    <p>Diese Website wird bei GitHub Pages (GitHub Inc., 88 Colin P. Kelly Jr. St, San Francisco, CA 94107, USA) gehostet. Beim Aufruf verarbeitet GitHub technisch notwendige Zugriffsdaten wie IP-Adresse, Zeitpunkt und abgerufene Datei, um die Seite auszuliefern und abzusichern. Details: <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">Datenschutzerklärung von GitHub</a>.</p>

    <h2>Keine Cookies, kein Tracking</h2>
    <p>Diese Website setzt keine Cookies, nutzt keine Analyse- oder Tracking-Dienste und keine Kontaktformulare. Schriften und Scripts werden direkt von dieser Website geladen, nicht von fremden Servern.</p>

    <h2>YouTube-Videos</h2>
    <p>Videos werden erst geladen, wenn du aktiv auf „Abspielen“ klickst. Dann wird eine Verbindung zu YouTube (Google Ireland Limited) im erweiterten Datenschutzmodus (youtube-nocookie.com) hergestellt, und es gelten die <a href="https://policies.google.com/privacy?hl=de" target="_blank" rel="noopener">Datenschutzbestimmungen von Google</a>.</p>

    <h2>Externe Links</h2>
    <p>Links zu Instagram, YouTube und Discord führen zu Angeboten von Drittanbietern. Erst beim Anklicken werden Daten an diese übertragen.</p>

    <h2>Deine Rechte</h2>
    <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung deiner Daten sowie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde. Schreib bei Fragen einfach an die oben genannte E-Mail-Adresse.</p>
  </main>
  <footer class="footer">
    <img src="assets/logo/logo-horizontal-white.webp" alt="Bauer Produktion" width="2000" height="667" loading="lazy">
    <span>© Bauer Produktion</span>
  </footer>
</body>
</html>
```

- [ ] **Step 5: `tools/dev-seed.mjs` (lokale Testdaten)**

```js
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processImage } from './lib/images.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = join(root, 'dev-data');
const shapes = [[1080, 1350], [1600, 900], [1080, 1080], [1080, 1350], [1080, 1350], [1920, 1080]];

function placeholder(w, h, label, hue) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},45%,38%)"/><stop offset="1" stop-color="hsl(${(hue + 60) % 360},40%,10%)"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="50%" fill="#fff" font-family="Arial" font-size="${Math.round(w / 10)}" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg().toBuffer();
}

const photos = [];
for (let i = 0; i < 40; i++) {
  const [w, h] = shapes[i % shapes.length];
  const id = `dev_${String(i + 1).padStart(2, '0')}`;
  const files = await processImage(await placeholder(w, h, `#${i + 1}`, (i * 37) % 360), id, join(base, 'media'));
  photos.push({
    id, source: 'instagram', date: new Date(Date.UTC(2026, 9, 14 - i)).toISOString(),
    caption: `Testbild ${i + 1} #gta #rp`, permalink: 'https://www.instagram.com/bauer_rp/',
    src: `dev-data/media/${files.src}`, thumb: `dev-data/media/${files.thumb}`, w: files.w, h: files.h,
  });
}
const videos = [];
for (let i = 0; i < 4; i++) {
  const id = `dQw4w9WgXc${i}`;
  const files = await processImage(await placeholder(1920, 1080, `Video ${i + 1}`, 200 + i * 30), `yt_${id}`, join(base, 'media'));
  videos.push({ id, title: `Testvideo ${i + 1} | Carporn | Bauer Produktion`, date: new Date(Date.UTC(2026, 8, 20 - i)).toISOString(), thumb: `dev-data/media/${files.src}`, thumbSmall: `dev-data/media/${files.thumb}` });
}
await mkdir(base, { recursive: true });
await writeFile(join(base, 'photos.json'), JSON.stringify(photos, null, 2));
await writeFile(join(base, 'videos.json'), JSON.stringify(videos, null, 2));
await writeFile(join(base, 'hidden.json'), JSON.stringify({ photos: ['dev_40'], videos: [] }, null, 2));
await writeFile(join(base, 'scripts.json'), JSON.stringify([
  { name: 'bauer_example', description: 'Beispiel-Script für die Vorschau.', features: ['Feature A', 'Feature B'], image: photos[1].thumb, link: 'https://github.com/', linkLabel: 'Ansehen' },
], null, 2));
console.log(`✓ dev-data: ${photos.length} Bilder, ${videos.length} Videos`);
```

Run (in `tools/`): `npm run dev-seed`
Expected: `✓ dev-data: 40 Bilder, 4 Videos`.

- [ ] **Step 6: Lokalen Server konfigurieren**

`.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "site", "runtimeExecutable": "python", "runtimeArgs": ["-m", "http.server", "8080"], "port": 8080 }
  ]
}
```

- [ ] **Step 7: Im Browser prüfen (noch ohne JS)**

Mit `preview_start` den Server „site“ starten und `http://localhost:8080/` öffnen.
Expected: schwarze Seite mit Filmkorn, Navigation oben, Hero mit dem quadratischen Logo, dem Schriftzug BAUER / PRODUKTION und dem Leitsatz. Nach 3 Sekunden sind die Hero-Elemente sichtbar (Fallback-Timer). Leistungen, Über, Scripts-Terminal, Kontakt und Footer sind korrekt gestaltet. Filmstreifen und Archiv sind leer, das ist erwartet. Bei 375 px Breite gibt es kein horizontales Scrollen der Seite, und das Menü wird zu „Menü“. `datenschutz.html` ist lesbar.

- [ ] **Step 8: Commit**

```bash
git add index.html datenschutz.html css tools/dev-seed.mjs .claude/launch.json
git commit -m "feat(web): Seitengerüst, Noir-Gestaltung, Datenschutz und Testdaten"
```

---

### Task 10: Motion, UI und Hero-Animation

**Files:**
- Create: `js/motion.js`, `js/ui.js`, `js/logo.js`, `js/main.js`

**Interfaces:**
- Consumes: `dataBase`, `loadJSON`, `visible` (Task 8), DOM-Verträge aus Task 9
- Produces: `motion.js` → `reduced: boolean`, `gsap: object|null`, `initMotion(): Lenis|null`. `ui.js` → `hideSection(id)`, `initNav(lenis)`, `initCopy()`, `initCounters(sources: Record<string, number>)`, `initReveal(root?)`, `initServices(photos)`, `splitChars(el): HTMLElement[]`. `logo.js` → `initHeroLogo(mount, { animate }): Promise<gsap.Timeline|null>`

- [ ] **Step 1: `js/motion.js`**

```js
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  || new URLSearchParams(location.search).has('reduced');
export const gsap = window.gsap ?? null;

export function initMotion() {
  if (!gsap) return null;
  gsap.registerPlugin(...[window.ScrollTrigger, window.DrawSVGPlugin].filter(Boolean));
  if (reduced || !window.Lenis || !window.ScrollTrigger) return null;
  const lenis = new window.Lenis({ lerp: 0.1 });
  lenis.on('scroll', window.ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
```

- [ ] **Step 2: `js/ui.js`**

```js
import { gsap, reduced } from './motion.js';

export function hideSection(id) {
  document.querySelectorAll(`[data-section="${id}"], [data-section-link="${id}"]`).forEach((el) => {
    el.hidden = true;
  });
}

const samePage = (url) => url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');

export function initNav(lenis) {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const toggle = nav.querySelector('[data-nav-toggle]');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('nav--hidden', y > lastY && y > 200 && !nav.classList.contains('nav--open'));
    lastY = y;
  }, { passive: true });

  const setOpen = (open) => {
    nav.classList.toggle('nav--open', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Schließen' : 'Menü';
    }
    if (open) lenis?.stop(); else lenis?.start();
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle?.addEventListener('click', () => setOpen(!nav.classList.contains('nav--open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', (e) => {
    setOpen(false);
    const url = new URL(link.href);
    if (!url.hash || !samePage(url)) return;
    const target = document.querySelector(url.hash);
    if (!target || !lenis) return;
    e.preventDefault();
    lenis.scrollTo(target);
    history.replaceState(null, '', url.hash);
  }));
}

export function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const status = btn.querySelector('[data-copy-status]');
    let timer;
    btn.addEventListener('click', async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        ok = true;
      } catch {
        ok = false;
      }
      if (status) status.textContent = ok ? 'Kopiert ✓' : `Discord-Name: ${btn.dataset.copy}`;
      clearTimeout(timer);
      timer = setTimeout(() => { if (status) status.textContent = 'Klicken zum Kopieren'; }, 2500);
    });
  });
}

export function initCounters(sources) {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const key = el.dataset.count;
    const fixed = /^\d+$/.test(key);
    const target = fixed ? Number(key) : sources[key] ?? 0;
    if (!fixed && target === 0) {
      el.closest('div').hidden = true;
      return;
    }
    const suffix = el.dataset.suffix ?? '';
    const set = (v) => { el.textContent = `${Math.round(v)}${suffix}`; };
    if (reduced || !gsap || !window.ScrollTrigger) {
      set(target);
      return;
    }
    const counter = { v: 0 };
    set(0);
    gsap.to(counter, {
      v: target, duration: 1.8, ease: 'power2.out', onUpdate: () => set(counter.v),
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

export function initReveal(root = document) {
  if (reduced || !gsap || !window.ScrollTrigger) return;
  root.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.from(el, { autoAlpha: 0, y: 40, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
}

export function initServices(photos) {
  const rows = document.querySelectorAll('[data-service]');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!rows.length || !canHover || !photos.length) return;
  const img = document.createElement('img');
  img.className = 'services__preview';
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  document.body.append(img);
  rows.forEach((row, i) => {
    const photo = photos[i % photos.length];
    row.addEventListener('mouseenter', () => {
      img.src = photo.thumb;
      img.classList.add('services__preview--on');
    });
    row.addEventListener('mouseleave', () => img.classList.remove('services__preview--on'));
    row.addEventListener('mousemove', (e) => {
      img.style.setProperty('--x', `${e.clientX}px`);
      img.style.setProperty('--y', `${e.clientY}px`);
    });
  });
}

export function splitChars(el) {
  if (!el) return [];
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  return [...text].map((ch) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = ch === ' ' ? ' ' : ch;
    el.append(span);
    return span;
  });
}
```

- [ ] **Step 3: `js/logo.js`**

```js
export async function initHeroLogo(mount, { animate }) {
  if (!mount) return null;
  let markup;
  try {
    const res = await fetch('assets/logo/logo.svg');
    if (!res.ok) return null;
    markup = await res.text();
  } catch {
    return null;
  }
  const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').querySelector('svg');
  if (!svg) return null;
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  mount.replaceChildren(document.importNode(svg, true));
  if (!animate || !window.DrawSVGPlugin) return null;

  const paths = mount.querySelectorAll('path');
  return window.gsap.timeline({ delay: 0.2 })
    .set(paths, { fillOpacity: 0, stroke: '#fff', strokeWidth: 1.5 })
    .fromTo(paths, { drawSVG: '0%' }, { drawSVG: '100%', duration: 3.2, ease: 'power1.inOut' })
    .to(paths, { fillOpacity: 1, duration: 1.2, ease: 'power2.out' }, '-=0.8')
    .to(paths, { strokeWidth: 0, duration: 0.8 }, '<0.4');
}
```

- [ ] **Step 4: `js/main.js` (Version 1: Hero, Navigation, Kopieren, Zähler, Reveal)**

```js
import { dataBase, loadJSON, visible } from './data.js';
import { initMotion, gsap, reduced } from './motion.js';
import { initNav, initCopy, initCounters, initReveal, initServices, hideSection, splitChars } from './ui.js';
import { initHeroLogo } from './logo.js';

async function initHero() {
  const animate = Boolean(gsap) && !reduced;
  const chars = splitChars(document.querySelector('[data-hero-word]'));
  const subChars = splitChars(document.querySelector('[data-hero-sub]'));
  const reveal = document.querySelectorAll('[data-hero-reveal]');
  if (animate) gsap.set(reveal, { autoAlpha: 0 });
  const logoTl = await initHeroLogo(document.querySelector('[data-logo]'), { animate });
  document.documentElement.classList.add('js-ready');
  if (!animate) return;
  const tl = gsap.timeline();
  if (logoTl) tl.add(logoTl);
  tl.set('.hero__title', { autoAlpha: 1 }, logoTl ? '-=1.4' : 0)
    .from(chars, { autoAlpha: 0, y: 30, duration: 0.9, ease: 'power3.out', stagger: 0.06 }, '<')
    .from(subChars, { autoAlpha: 0, duration: 0.6, stagger: 0.04 }, '-=0.5')
    .fromTo('.hero__rule', { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power3.inOut' }, '<')
    .fromTo('.hero__claim', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8 }, '-=0.4')
    .fromTo('.hero__scroll', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 });
}

function setHeroBackground(photo) {
  const bg = document.querySelector('[data-hero-bg]');
  if (!bg) return;
  bg.style.backgroundImage = `url("${photo.src}")`;
  if (gsap && !reduced) gsap.to(bg, { scale: 1, duration: 12, ease: 'none' });
}

async function main() {
  const lenis = initMotion();
  initNav(lenis);
  initCopy();
  const hero = initHero();
  const base = dataBase();
  const [photosRaw, videosRaw, hiddenRaw] = await Promise.all([
    loadJSON(`${base}photos.json`, []),
    loadJSON(`${base}videos.json`, []),
    loadJSON(`${base}hidden.json`, {}),
  ]);
  const photos = visible(photosRaw, hiddenRaw?.photos);
  const videos = visible(videosRaw, hiddenRaw?.videos);

  if (photos.length) setHeroBackground(photos[0]);
  else { hideSection('neueste'); hideSection('archiv'); }
  if (!videos.length) hideSection('videos');

  initServices(photos);
  initCounters({ photos: photos.length, videos: videos.length });
  initReveal();
  await hero;
  window.ScrollTrigger?.refresh();
}

main().catch((err) => {
  console.error(err);
  document.documentElement.classList.add('js-ready');
});
```

- [ ] **Step 5: Im Browser prüfen**

`http://localhost:8080/?dev` öffnen (Server aus Task 9).
Expected: Das Logo wird Strich für Strich gezeichnet und füllt sich, danach erscheinen BAUER buchstabenweise, PRODUKTION, die Linie, der Leitsatz und der Scroll-Hinweis. Im Hintergrund ist schwach Testbild #1 zu sehen. Beim Scrollen gleiten die Abschnitte ein, die Zähler zählen hoch (Bilder 39, weil `dev_40` ausgeblendet ist, Videos 4). Die Navigation blendet beim Runterscrollen aus und beim Hochscrollen ein, Menülinks scrollen weich. Ein Klick auf Discord zeigt „Kopiert ✓“. Beim Überfahren der Leistungen folgt ein Bild der Maus. In der Konsole gibt es keine Fehler (`read_console_messages` mit `onlyErrors`).
Danach `http://localhost:8080/` ohne `?dev` öffnen: Filmstreifen, Archiv, Videos und die Nav-Links „Portfolio“ und „Videos“ sind ausgeblendet, die Zähler für Bilder und Videos ebenfalls, und es gibt keine Konsolenfehler.

- [ ] **Step 6: Commit**

```bash
git add js/motion.js js/ui.js js/logo.js js/main.js
git commit -m "feat(web): Hero-Logo-Zeichnung, Navigation, Zähler und Reveals"
```

---

### Task 11: Filmstreifen, Archiv und Großansicht

**Files:**
- Create: `js/lightbox.js`, `js/gallery.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `altText`, `pad`, `tileSize`, `firstPage` (Task 8), `gsap`, `reduced` (Task 10)
- Produces: `createLightbox(dialog, { onOpen, onClose }): { open(items: Photo[], index: number): void }`, `initStrip(section, photos, lightbox)`, `initArchive(section, photos, lightbox)`

- [ ] **Step 1: `js/lightbox.js`**

```js
import { altText, pad } from './data.js';

export function createLightbox(dialog, { onOpen, onClose } = {}) {
  const img = dialog.querySelector('[data-lb-img]');
  const caption = dialog.querySelector('[data-lb-caption]');
  const link = dialog.querySelector('[data-lb-link]');
  const counter = dialog.querySelector('[data-lb-counter]');
  const flash = dialog.querySelector('[data-lb-flash]');
  let list = [];
  let index = 0;
  let lastFocus = null;

  const show = () => {
    const photo = list[index];
    img.src = photo.src;
    img.alt = altText(photo.caption);
    img.width = photo.w || 1080;
    img.height = photo.h || 1350;
    caption.textContent = altText(photo.caption, '');
    link.hidden = !photo.permalink;
    if (photo.permalink) link.href = photo.permalink;
    counter.textContent = `${pad(index + 1)} / ${pad(list.length)}`;
  };
  const step = (delta) => {
    index = (index + delta + list.length) % list.length;
    show();
  };

  dialog.querySelector('[data-lb-prev]').addEventListener('click', () => step(-1));
  dialog.querySelector('[data-lb-next]').addEventListener('click', () => step(1));
  dialog.querySelector('[data-lb-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  let startX = null;
  dialog.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  dialog.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });
  dialog.addEventListener('close', () => {
    onClose?.();
    lastFocus?.focus({ preventScroll: true });
  });

  return {
    open(items, i) {
      if (!items.length) return;
      list = items;
      index = Math.min(Math.max(i, 0), items.length - 1);
      lastFocus = document.activeElement;
      show();
      dialog.showModal();
      onOpen?.();
      flash.classList.remove('flash--fire');
      void flash.offsetWidth;
      flash.classList.add('flash--fire');
    },
  };
}
```

- [ ] **Step 2: `js/gallery.js`**

```js
import { gsap, reduced } from './motion.js';
import { altText, pad, tileSize, firstPage } from './data.js';

const STRIP_COUNT = 12;
const PAGE_SIZE = 24;

function photoButton(photo, index, onOpen, sizes, eager = false) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', `Bild ${index + 1} groß anzeigen`);
  const img = document.createElement('img');
  img.src = photo.thumb;
  img.srcset = `${photo.thumb} 800w, ${photo.src} 1600w`;
  img.sizes = sizes;
  img.width = photo.w || 1080;
  img.height = photo.h || 1350;
  img.loading = eager ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.alt = altText(photo.caption);
  btn.append(img);
  btn.addEventListener('click', () => onOpen(index));
  return btn;
}

export function initStrip(section, photos, lightbox) {
  const items = photos.slice(0, STRIP_COUNT);
  const track = section.querySelector('[data-strip-track]');
  const viewport = section.querySelector('.strip__viewport');
  const pin = section.querySelector('.strip__pin');
  const bar = section.querySelector('[data-strip-progress]');
  const current = section.querySelector('[data-strip-current]');
  section.querySelector('[data-strip-total]').textContent = pad(items.length);

  items.forEach((photo, i) => {
    const li = document.createElement('li');
    li.className = 'strip__item';
    li.append(photoButton(photo, i, (idx) => lightbox.open(items, idx), '(max-width: 700px) 80vw, 40vw', i < 4));
    track.append(li);
  });

  const update = (progress) => {
    bar.style.transform = `scaleX(${progress})`;
    current.textContent = pad(Math.min(items.length, Math.round(progress * (items.length - 1)) + 1));
  };
  const onNativeScroll = () => {
    const max = viewport.scrollWidth - viewport.clientWidth;
    update(max > 0 ? viewport.scrollLeft / max : 0);
  };
  update(0);

  if (!gsap || !window.ScrollTrigger || reduced) {
    viewport.addEventListener('scroll', onNativeScroll, { passive: true });
    return;
  }
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    section.classList.add('strip--pinned');
    const padding = () => parseFloat(getComputedStyle(viewport).paddingLeft) * 2;
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + padding());
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section, pin, start: 'top top', end: () => `+=${distance()}`,
        scrub: 0.6, invalidateOnRefresh: true, onUpdate: (self) => update(self.progress),
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { x: 0 });
      section.classList.remove('strip--pinned');
    };
  });
  mm.add('(max-width: 767px)', () => {
    viewport.addEventListener('scroll', onNativeScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onNativeScroll);
  });
}

function reveal(items) {
  if (!gsap || !window.ScrollTrigger || reduced || !items.length) return;
  gsap.set(items, { clipPath: 'inset(100% 0% 0% 0%)' });
  window.ScrollTrigger.batch(items, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut', stagger: 0.12 }),
  });
}

export function initArchive(section, photos, lightbox) {
  const grid = section.querySelector('[data-archive-grid]');
  const more = section.querySelector('[data-archive-more]');
  let pages = 1;
  let rendered = 0;

  const render = () => {
    const list = firstPage(photos, pages, PAGE_SIZE);
    const fresh = [];
    for (let i = rendered; i < list.length; i++) {
      const photo = list[i];
      const li = document.createElement('li');
      li.className = `archive__item archive__item--${tileSize(photo.w, photo.h)}`;
      li.append(photoButton(photo, i, (idx) => lightbox.open(photos, idx), '(max-width: 700px) 50vw, 33vw'));
      grid.append(li);
      fresh.push(li);
    }
    rendered = list.length;
    more.hidden = rendered >= photos.length;
    reveal(fresh);
    return fresh;
  };

  more.addEventListener('click', () => {
    pages += 1;
    const fresh = render();
    window.ScrollTrigger?.refresh();
    fresh[0]?.querySelector('button')?.focus({ preventScroll: true });
  });
  render();
}
```

- [ ] **Step 3: `js/main.js` erweitern**

Die Importzeilen ergänzen. Ersetze
```js
import { initHeroLogo } from './logo.js';
```
durch
```js
import { initHeroLogo } from './logo.js';
import { createLightbox } from './lightbox.js';
import { initStrip, initArchive } from './gallery.js';
```
und ersetze
```js
  if (photos.length) setHeroBackground(photos[0]);
  else { hideSection('neueste'); hideSection('archiv'); }
```
durch
```js
  const lightbox = createLightbox(document.querySelector('[data-lightbox]'), {
    onOpen: () => lenis?.stop(),
    onClose: () => lenis?.start(),
  });
  if (photos.length) {
    setHeroBackground(photos[0]);
    initStrip(document.querySelector('#neueste'), photos, lightbox);
    initArchive(document.querySelector('#archiv'), photos, lightbox);
  } else {
    hideSection('neueste');
    hideSection('archiv');
  }
```

- [ ] **Step 4: Im Browser prüfen**

`http://localhost:8080/?dev` (Desktop-Breite):
- Der Filmstreifen bleibt stehen, beim Scrollen fahren 12 Bilder seitwärts, Zähler und Linie laufen von 01 bis 12 mit, danach geht es normal weiter.
- Das Archiv zeigt 24 Bilder in gemischten Formaten. Beim Scrollen decken sie sich wie ein Vorhang auf, beim Überfahren erscheinen die Sucher-Ecken.
- „Mehr laden“ ergänzt auf 39 und verschwindet dann, und der Fokus springt aufs erste neue Bild.
- Ein Klick auf ein Bild öffnet die Großansicht mit Blitz und Zähler `05 / 39`. Pfeiltasten und die Pfeil-Buttons blättern, Esc schließt, und der Fokus kehrt zurück. „Auf Instagram ansehen ↗“ ist sichtbar. Die Seite scrollt bei geöffneter Großansicht nicht.

Mit `resize_window` auf `mobile`, dann neu laden:
- Der Filmstreifen ist horizontal wischbar und nicht fixiert, der Zähler folgt.
- Das Archiv ist zweispaltig, die Großansicht hat ihre Buttons unten, und Wischen blättert.

Danach `resize_window` auf `desktop` zurücksetzen. Es dürfen keine Konsolenfehler auftreten.

- [ ] **Step 5: Commit**

```bash
git add js/lightbox.js js/gallery.js js/main.js
git commit -m "feat(web): Filmstreifen, Editorial-Archiv und Großansicht mit Blitz"
```

---

### Task 12: Video-Stapel

**Files:**
- Create: `js/videos.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `pad` (Task 8), `gsap`, `reduced` (Task 10)
- Produces: `initVideos(section, videos)` (max. 6 Karten)

- [ ] **Step 1: `js/videos.js`**

```js
import { gsap, reduced } from './motion.js';
import { pad } from './data.js';

const MAX_VIDEOS = 6;

function videoCard(video, index, total) {
  const card = document.createElement('article');
  card.className = 'vcard';

  const media = document.createElement('div');
  media.className = 'vcard__media';
  const img = document.createElement('img');
  img.src = video.thumbSmall;
  img.srcset = `${video.thumbSmall} 800w, ${video.thumb} 1600w`;
  img.sizes = '100vw';
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  media.append(img);

  const body = document.createElement('div');
  body.className = 'vcard__body';
  const label = document.createElement('span');
  label.className = 'vcard__index';
  label.textContent = `VIDEO · ${pad(index + 1)} / ${pad(total)}`;
  const title = document.createElement('h3');
  title.className = 'vcard__title';
  title.textContent = video.title;
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'vcard__play';
  play.setAttribute('aria-label', `Video abspielen: ${video.title}`);
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '▶';
  play.append(icon, 'Abspielen');
  play.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.className = 'vcard__frame';
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1&rel=0`;
    frame.title = video.title;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    card.append(frame);
    frame.focus();
  }, { once: true });

  body.append(label, title, play);
  card.append(media, body);
  return card;
}

export function initVideos(section, videos) {
  const stack = section.querySelector('[data-video-stack]');
  const items = videos.slice(0, MAX_VIDEOS);
  const cards = items.map((video, i) => {
    const card = videoCard(video, i, items.length);
    stack.append(card);
    return card;
  });
  if (!gsap || !window.ScrollTrigger || reduced) return;
  cards.slice(0, -1).forEach((card, i) => {
    gsap.to(card.querySelector('.vcard__media'), {
      scale: 0.9, opacity: 0.35, ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: true },
    });
  });
}
```

- [ ] **Step 2: `js/main.js` erweitern**

Ersetze
```js
import { initStrip, initArchive } from './gallery.js';
```
durch
```js
import { initStrip, initArchive } from './gallery.js';
import { initVideos } from './videos.js';
```
und ersetze
```js
  if (!videos.length) hideSection('videos');
```
durch
```js
  if (videos.length) initVideos(document.querySelector('#videos'), videos);
  else hideSection('videos');
```

- [ ] **Step 3: Im Browser prüfen**

`http://localhost:8080/?dev`: Der Video-Bereich zeigt 4 bildschirmfüllende Karten. Beim Scrollen schiebt sich jede über die vorige, die vorige schrumpft und dunkelt ab. Mit `read_network_requests` (Filter `youtube`) prüfen, dass **vor** dem Klick keine Anfrage an YouTube geht. Ein Klick auf „Abspielen“ lädt den Player von `youtube-nocookie.com`, bei Testvideo-IDs ist ein Fehlerbild von YouTube in Ordnung. Auch auf `mobile` prüfen und danach wieder auf `desktop` zurücksetzen.

- [ ] **Step 4: Commit**

```bash
git add js/videos.js js/main.js
git commit -m "feat(web): Video-Projekte als Vollbild-Stapel mit Klick-zum-Abspielen"
```

---

### Task 13: Scripts-Unterseite

**Files:**
- Create: `scripts.html`, `js/scripts.js`

**Interfaces:**
- Consumes: `dataBase`, `loadJSON` (Task 8), `initMotion` (Task 10), `initNav`, `initReveal` (Task 10)
- Produces: `data/scripts.json`-Format `[{ name, description, features?: string[], image?: string, link?: 'https://…', linkLabel?: string }]`

- [ ] **Step 1: `scripts.html`**

```html
<!doctype html>
<html lang="de" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scripts – Bauer Produktion</title>
  <meta name="description" content="FiveM-Scripts von Bauer Produktion.">
  <meta name="theme-color" content="#000000">
  <link rel="icon" type="image/png" href="assets/logo/favicon-64.png">
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/style.css">
  <script>document.documentElement.classList.replace('no-js', 'js');</script>
</head>
<body>
  <a class="skip" href="#main">Zum Inhalt springen</a>
  <div class="grain" aria-hidden="true"></div>
  <header class="nav" data-nav>
    <a class="nav__brand" href="./" aria-label="Bauer Produktion – Startseite">BAUER</a>
    <button class="nav__toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="nav-menu">Menü</button>
    <nav id="nav-menu" class="nav__menu" data-nav-menu aria-label="Hauptnavigation">
      <a href="./#neueste">Portfolio</a>
      <a href="./#videos">Videos</a>
      <a href="./#leistungen">Leistungen</a>
      <a href="./#ueber">Über</a>
      <a href="scripts.html" aria-current="page">Scripts</a>
      <a href="./#kontakt">Kontakt</a>
    </nav>
  </header>
  <main id="main">
    <section class="page-hero">
      <span class="eyebrow">Werkstatt</span>
      <h1 class="display" data-reveal>FiveM Scripts</h1>
      <p data-reveal>Neben der Kamera entstehen hier eigene Scripts für FiveM-Server. Fragen dazu gern über Discord.</p>
    </section>
    <section class="section" style="padding-top:0" aria-label="Script-Liste">
      <div class="scripts__grid" data-scripts-grid></div>
      <div class="terminal" data-scripts-empty hidden>
        <div class="terminal__bar" aria-hidden="true"><span></span><span></span><span></span></div>
        <p class="terminal__body"><span class="terminal__prompt">bauer@produktion:~$</span> ls ./fivem-scripts
Scripts folgen in Kürze. <span class="terminal__cursor" aria-hidden="true"></span></p>
      </div>
      <noscript><p>Die Script-Liste benötigt JavaScript.</p></noscript>
    </section>
  </main>
  <footer class="footer">
    <img src="assets/logo/logo-horizontal-white.webp" alt="Bauer Produktion" width="2000" height="667" loading="lazy">
    <a href="datenschutz.html">Datenschutz</a>
    <span>© Bauer Produktion</span>
  </footer>
  <script src="vendor/gsap/gsap.min.js" defer></script>
  <script src="vendor/gsap/ScrollTrigger.min.js" defer></script>
  <script src="vendor/lenis/lenis.min.js" defer></script>
  <script type="module" src="js/scripts.js"></script>
</body>
</html>
```

- [ ] **Step 2: `js/scripts.js`**

```js
import { dataBase, loadJSON } from './data.js';
import { initMotion } from './motion.js';
import { initNav, initReveal } from './ui.js';

function scriptCard(script) {
  const card = document.createElement('article');
  card.className = 'script-card';
  card.dataset.reveal = '';
  if (script.image) {
    const img = document.createElement('img');
    img.src = script.image;
    img.alt = `Vorschau: ${script.name}`;
    img.loading = 'lazy';
    card.append(img);
  }
  const body = document.createElement('div');
  body.className = 'script-card__body';
  const title = document.createElement('h2');
  title.textContent = script.name;
  body.append(title);
  if (script.description) {
    const p = document.createElement('p');
    p.textContent = script.description;
    body.append(p);
  }
  if (Array.isArray(script.features) && script.features.length) {
    const ul = document.createElement('ul');
    for (const feature of script.features) {
      const li = document.createElement('li');
      li.textContent = feature;
      ul.append(li);
    }
    body.append(ul);
  }
  if (typeof script.link === 'string' && script.link.startsWith('https://')) {
    const a = document.createElement('a');
    a.className = 'btn';
    a.href = script.link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = script.linkLabel || 'Ansehen';
    body.append(a);
  }
  card.append(body);
  return card;
}

const lenis = initMotion();
initNav(lenis);
const scripts = await loadJSON(`${dataBase()}scripts.json`, []);
const list = Array.isArray(scripts) ? scripts.filter((s) => s && typeof s.name === 'string' && s.name) : [];
const grid = document.querySelector('[data-scripts-grid]');
if (list.length) list.forEach((s) => grid.append(scriptCard(s)));
else document.querySelector('[data-scripts-empty]').hidden = false;
initReveal();
```

- [ ] **Step 3: Im Browser prüfen**

`http://localhost:8080/scripts.html` zeigt den Terminal-Hinweis „Scripts folgen in Kürze“. `http://localhost:8080/scripts.html?dev` zeigt die Beispielkarte mit Bild, Features und dem Button „Ansehen“. Die Navigation markiert „Scripts“, und „Portfolio“ führt zurück zur Startseite an `#neueste`. Es dürfen keine Konsolenfehler auftreten.

- [ ] **Step 4: Commit**

```bash
git add scripts.html js/scripts.js
git commit -m "feat(web): Scripts-Unterseite aus data/scripts.json"
```

---

### Task 14: GitHub-Workflow und README

**Files:**
- Create: `.github/workflows/pages.yml`, `README.md`

**Interfaces:**
- Consumes: `tools/sync.mjs` (CLI), `npm test`

- [ ] **Step 1: `.github/workflows/pages.yml`**

```yaml
name: Sync & Deploy

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 5 * * *'
  workflow_dispatch:

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  sync-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: tools/package-lock.json

      - name: Abhängigkeiten
        working-directory: tools
        run: npm ci

      - name: Tests
        working-directory: tools
        run: npm test

      - name: Instagram, YouTube & manuelle Bilder holen
        working-directory: tools
        env:
          BEHOLD_FEED_URL: ${{ secrets.BEHOLD_FEED_URL }}
        run: node sync.mjs

      - name: Änderungen speichern
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data media
          if git diff --cached --quiet; then
            echo "Keine neuen Inhalte."
          else
            git commit -m "chore: sync media"
            git push
          fi

      - name: Seite zusammenstellen
        run: |
          mkdir _site
          for p in index.html scripts.html datenschutz.html css js vendor assets data media; do
            if [ -e "$p" ]; then cp -r "$p" _site/; fi
          done

      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - id: deploy
        uses: actions/deploy-pages@v4
```

Hinweis: Ein Push mit `GITHUB_TOKEN` löst keinen neuen Workflow-Lauf aus, es entsteht also keine Schleife. Der Deploy im selben Lauf enthält die neuen Bilder bereits.

- [ ] **Step 2: YAML prüfen**

Run (in `tools/`): `node -e "const y=require('fs').readFileSync('../.github/workflows/pages.yml','utf8'); if(/\t/.test(y)) throw new Error('Tabs im YAML'); console.log('ok', y.split('\n').length, 'Zeilen')"`
Expected: `ok … Zeilen`. Die eigentliche Validierung passiert beim ersten Lauf auf GitHub (Task 15).

- [ ] **Step 3: `README.md`**

````markdown
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
Lokal starten: `python -m http.server 8080` im Projektordner, dann `http://localhost:8080/?dev` öffnen (`?dev` nutzt die Testdaten).

Eigene Domain später: *Settings → Pages → Custom domain*, danach beim Domain-Anbieter einen CNAME-Eintrag auf `<dein-name>.github.io` setzen.
````

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/pages.yml README.md
git commit -m "ci: täglicher Sync und Deploy auf GitHub Pages, README"
```

---

### Task 15: Gesamtprüfung und Veröffentlichung

**Files:**
- Modify: nur bei gefundenen Fehlern (in der jeweils zuständigen Datei aus Task 9–13)

- [ ] **Step 1: Alle Tests**

Run (in `tools/`): `npm test`
Expected: alle PASS.

- [ ] **Step 2: Browser-Checkliste mit `?dev`**

Jeden Punkt prüfen, Fehler in der zuständigen Datei beheben und jeweils einzeln committen:
- [ ] Desktop 1440 px: der ganze Ablauf Hero → Filmstreifen → Archiv → Videos → Leistungen → Über → Scripts → Kontakt → Footer, ohne Ruckler und ohne Konsolenfehler
- [ ] Mobil (`resize_window` mobile): kein horizontales Scrollen der Seite, das Menü öffnet und schließt, alle Bereiche sind bedienbar
- [ ] Reduzierte Bewegung: `http://localhost:8080/?dev&reduced` öffnen (der Test-Schalter aus `js/motion.js`). Erwartet: kein Pinning, kein Zeichnen, kein Lenis, alle Inhalte sofort sichtbar, und der Filmstreifen ist horizontal scrollbar.
- [ ] JS-Ausfall: `js/main.js` kurz in `js/main.off.js` umbenennen, die Seite neu laden und mit `get_page_text` prüfen. Erwartet: Der Hero ist nach 3 s sichtbar, alle statischen Bereiche sind lesbar. Danach zurückbenennen.
- [ ] Leere Daten (`/` ohne `?dev`): Portfolio, Archiv, Videos und die zugehörigen Nav-Links sind ausgeblendet, keine Fehler
- [ ] Tastatur: Tab erreicht alle Links und Buttons, Fokusrahmen sind sichtbar, die Großansicht ist per Tastatur bedienbar
- [ ] Netzwerk (`read_network_requests`): beim Laden keine Anfragen an fremde Hosts

- [ ] **Step 3: Lighthouse**

Run: `npx --yes lighthouse@12 http://localhost:8080/?dev --only-categories=performance,accessibility --quiet --chrome-flags="--headless=new" --output=json --output-path=../lighthouse.json` (aus `tools/`). Danach Werte auslesen:
`node -e "const r=require('../lighthouse.json');console.log(r.categories.performance.score*100, r.categories.accessibility.score*100)"`
Expected: Performance ≥ 85, Barrierefreiheit ≥ 90. Ist kein Chrome installiert, diesen Schritt melden und auslassen. `lighthouse.json` nicht committen, sondern danach löschen.

- [ ] **Step 4: Veröffentlichung mit dem Inhaber**

Das macht der Inhaber selbst, die Anleitung steht in der README. Dazu gehören das GitHub-Konto, das Repository und das Secret. Der Agent erklärt die Schritte und hilft beim `git remote add` / `git push`, sobald der Inhaber die Repo-URL nennt. Nach dem ersten Workflow-Lauf auf GitHub prüfen:
- [ ] Workflow grün, Tests grün
- [ ] `data/videos.json` enthält echte Videos ohne Shorts
- [ ] Mit gesetztem Secret enthält `data/photos.json` die neuesten Instagram-Bilder
- [ ] Die Live-Seite lädt, und die Animationen laufen

- [ ] **Step 5: Abschluss-Commit (falls Korrekturen anfielen)**

```bash
git add -A
git commit -m "fix: Korrekturen aus der Gesamtprüfung"
```
