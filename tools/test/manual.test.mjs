import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { manualId, dateFromFilename, listManualFiles } from '../lib/manual.mjs';

const HASH = '-[0-9a-f]{6}$';

test('IDs sind lesbar, klein, ohne Umlaute und Sonderzeichen', () => {
  assert.match(manualId('Über Nacht (1).JPG'), new RegExp(`^manual_ueber-nacht-1${HASH}`));
  assert.match(manualId('2025-06-01_Sommer Dance.png'), new RegExp(`^manual_2025-06-01-sommer-dance${HASH}`));
  assert.match(manualId('Straße.webp'), new RegExp(`^manual_strasse${HASH}`));
});

test('IDs hängen nur vom eigenen Dateinamen ab und kollidieren nicht', () => {
  const ids = ['a.jpg', 'a.png', 'a-2.jpg', 'A.jpg'].map(manualId);
  assert.equal(new Set(ids).size, 4);
  assert.equal(manualId('a.jpg'), manualId('a.jpg'));
});

test('NFC- und NFD-Schreibweise ergeben dieselbe ID', () => {
  assert.equal(manualId('Bär.jpg'.normalize('NFD')), manualId('Bär.jpg'.normalize('NFC')));
  assert.match(manualId('Bär.jpg'.normalize('NFD')), new RegExp(`^manual_baer${HASH}`));
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
  assert.equal(list.length, 3);
  assert.equal(new Set(list.map((m) => m.id)).size, 3);
  const xmas = list.find((m) => m.file.endsWith('2024-12-24_weihnacht.jpg'));
  assert.equal(xmas.date, '2024-12-24T12:00:00.000Z');
  assert.match(list.find((m) => m.file.endsWith('foto-1.png')).date, /^\d{4}-\d{2}-\d{2}T/);
});

test('ohne Datums-Präfix wird EXIF DateTimeOriginal genutzt (nicht DateTime)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bp-man-'));
  const exif = (tags) => sharp({ create: { width: 4, height: 4, channels: 3, background: '#000' } }).jpeg().withExif(tags).toBuffer();
  await writeFile(join(dir, 'kamera.jpg'), await exif({
    IFD0: { DateTime: '2020:01:01 00:00:00' },
    IFD2: { DateTimeOriginal: '2023:05:17 18:30:00' },
  }));
  await writeFile(join(dir, 'bearbeitet.jpg'), await exif({ IFD0: { DateTime: '2020:01:01 00:00:00' } }));
  await writeFile(join(dir, '2024-12-24_mit-exif.jpg'), await exif({ IFD2: { DateTimeOriginal: '2023:05:17 18:30:00' } }));
  const list = await listManualFiles(dir);
  const date = (name) => list.find((m) => m.file.endsWith(name)).date;
  assert.equal(date('kamera.jpg'), '2023-05-17T18:30:00.000Z');
  assert.notEqual(date('bearbeitet.jpg'), '2020-01-01T00:00:00.000Z');
  assert.equal(date('2024-12-24_mit-exif.jpg'), '2024-12-24T12:00:00.000Z');
});

test('ID einer Datei bleibt gleich, wenn später ähnlich benannte Dateien dazukommen', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bp-man-'));
  await writeFile(join(dir, 'foto-1.png'), 'x');
  const before = (await listManualFiles(dir))[0].id;
  await writeFile(join(dir, 'Foto 1.jpg'), 'x');
  const after = await listManualFiles(dir);
  assert.equal(after.find((m) => m.file.endsWith('foto-1.png')).id, before);
  assert.notEqual(after.find((m) => m.file.endsWith('Foto 1.jpg')).id, before);
});

test('fehlender Ordner ergibt leere Liste', async () => {
  assert.deepEqual(await listManualFiles(join(tmpdir(), 'gibt-es-nicht-bp')), []);
});
