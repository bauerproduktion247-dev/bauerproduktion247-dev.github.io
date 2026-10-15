import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
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
