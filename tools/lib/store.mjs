import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function readJSON(file, fallback) {
  let raw;
  try {
    raw = await readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
  return JSON.parse(raw);
}

export async function writeJSONIfChanged(file, data) {
  const next = JSON.stringify(data, null, 2) + '\n';
  let prev = null;
  try {
    prev = await readFile(file, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (prev === next) return false;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, next);
  return true;
}
