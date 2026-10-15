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
