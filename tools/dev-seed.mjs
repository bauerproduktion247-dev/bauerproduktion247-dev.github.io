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
