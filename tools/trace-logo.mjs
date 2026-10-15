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
  .replace(/\s(width|height|viewBox)="[^"]*"/g, '')
  .replace('<svg ', `<svg viewBox="0 0 ${width} ${meta.height}" `)
  .replace(/<path /g, '<path class="logo-mark__path" ');
await writeFile(join(logoDir, 'logo.svg'), svg);
console.log(`✓ logo.svg (${width}×${meta.height})`);

const square = join(logoDir, 'logo-square-white.webp');
await sharp(square).resize(64, 64).png().toFile(join(logoDir, 'favicon-64.png'));
await sharp(square).resize(180, 180).png().toFile(join(logoDir, 'apple-touch-icon.png'));
console.log('✓ Favicons');
