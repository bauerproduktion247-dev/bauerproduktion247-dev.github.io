import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|tiff?)$/i;

export function manualId(filename) {
  const slug = filename
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `manual_${slug || 'bild'}`;
}

export function dateFromFilename(filename) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[_ -]/.exec(filename);
  if (!match) return null;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], 12));
  if (date.getUTCMonth() !== +match[2] - 1 || date.getUTCDate() !== +match[3]) return null;
  return date.toISOString();
}

export async function listManualFiles(dir) {
  let names;
  try {
    names = await readdir(dir);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const used = new Map();
  const out = [];
  for (const name of names.filter((n) => IMAGE_EXT.test(n)).sort()) {
    const base = manualId(name);
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    const file = join(dir, name);
    const date = dateFromFilename(name) ?? (await stat(file)).mtime.toISOString();
    out.push({ id: count === 1 ? base : `${base}-${count}`, file, date });
  }
  return out;
}
