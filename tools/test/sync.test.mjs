import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
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
