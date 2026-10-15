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
