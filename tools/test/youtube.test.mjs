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

test('Short = /shorts/<id> antwortet mit 200, Weiterleitung (3xx) = kein Short', async () => {
  const fetchFn = fakeFetch({ [shortsUrl('S')]: status(200), [shortsUrl('L')]: status(303), [shortsUrl('M')]: status(301) });
  assert.equal(await isShort('S', fetchFn), true);
  assert.equal(await isShort('L', fetchFn), false);
  assert.equal(await isShort('M', fetchFn), false);
  assert.equal(fetchFn.calls[0].method, 'HEAD');
});

test('unklare Antwort wirft, damit das Video beim nächsten Lauf erneut geprüft wird', async () => {
  const fetchFn = fakeFetch({ [shortsUrl('A')]: status(429), [shortsUrl('B')]: status(500), [shortsUrl('C')]: status(404) });
  await assert.rejects(() => isShort('A', fetchFn), /429/);
  await assert.rejects(() => isShort('B', fetchFn), /500/);
  await assert.rejects(() => isShort('C', fetchFn), /404/);
});

test('URLs', () => {
  assert.equal(rssUrl('UC1'), 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1');
  assert.deepEqual(thumbUrls('X'), ['https://i.ytimg.com/vi/X/maxresdefault.jpg', 'https://i.ytimg.com/vi/X/hqdefault.jpg']);
});
