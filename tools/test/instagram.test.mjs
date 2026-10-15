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
