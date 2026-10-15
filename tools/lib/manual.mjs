import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|tiff?)$/i;

export function manualId(filename) {
  const name = filename.normalize('NFC');
  const hash = createHash('sha1').update(name).digest('hex').slice(0, 6);
  const slug = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `manual_${slug || 'bild'}-${hash}`;
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
  const out = [];
  for (const name of names.filter((n) => IMAGE_EXT.test(n)).sort()) {
    const file = join(dir, name);
    const date = dateFromFilename(name) ?? (await stat(file)).mtime.toISOString();
    out.push({ id: manualId(name), file, date });
  }
  return out;
}
