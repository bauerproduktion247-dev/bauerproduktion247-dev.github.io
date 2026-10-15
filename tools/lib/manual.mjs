import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

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

/** Liest EXIF DateTimeOriginal (Tag 0x9003 im Exif-IFD) aus dem Roh-EXIF, das sharp liefert. */
export function exifDateTimeOriginal(exif) {
  if (!exif || exif.length < 14 || exif.toString('latin1', 0, 4) !== 'Exif') return null;
  const tiff = exif.subarray(6);
  const le = tiff.toString('latin1', 0, 2) === 'II';
  const u16 = (o) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
  const findTag = (ifd, tag) => {
    if (ifd + 2 > tiff.length) return null;
    const count = u16(ifd);
    for (let i = 0; i < count; i++) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > tiff.length) return null;
      if (u16(entry) === tag) return entry;
    }
    return null;
  };
  try {
    const exifPointer = findTag(u32(4), 0x8769);
    if (exifPointer === null) return null;
    const entry = findTag(u32(exifPointer + 8), 0x9003);
    if (entry === null) return null;
    const offset = u32(entry + 8);
    const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(tiff.toString('latin1', offset, offset + 19));
    if (!match) return null;
    const [, y, mo, d, h, mi, s] = match.map(Number);
    const date = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
    if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

async function dateFromExif(file) {
  try {
    return exifDateTimeOriginal((await sharp(file).metadata()).exif);
  } catch {
    return null;
  }
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
    const date = dateFromFilename(name) ?? (await dateFromExif(file)) ?? (await stat(file)).mtime.toISOString();
    out.push({ id: manualId(name), file, date });
  }
  return out;
}
