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
