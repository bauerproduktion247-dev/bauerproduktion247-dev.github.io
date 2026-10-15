import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export const SIZES = { thumb: 800, src: 1600 };

export async function processImage(input, id, outDir) {
  await mkdir(outDir, { recursive: true });
  const result = {};
  for (const [key, width] of Object.entries(SIZES)) {
    const file = `${id}-${width}.webp`;
    const info = await sharp(input, { failOn: 'error' })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(outDir, file));
    result[key] = file;
    if (key === 'src') {
      result.w = info.width;
      result.h = info.height;
    }
  }
  return result;
}
