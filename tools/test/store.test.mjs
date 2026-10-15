import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readJSON, writeJSONIfChanged } from '../lib/store.mjs';

const tmp = () => mkdtemp(join(tmpdir(), 'bp-store-'));

test('readJSON liefert Fallback, wenn Datei fehlt', async () => {
  const dir = await tmp();
  assert.deepEqual(await readJSON(join(dir, 'nope.json'), []), []);
});

test('readJSON wirft bei kaputtem JSON statt Fallback', async () => {
  const dir = await tmp();
  const file = join(dir, 'bad.json');
  await writeFile(file, '{oops');
  await assert.rejects(() => readJSON(file, []));
});

test('writeJSONIfChanged schreibt nur bei Änderung', async () => {
  const dir = await tmp();
  const file = join(dir, 'sub', 'a.json');
  assert.equal(await writeJSONIfChanged(file, [{ id: 'a' }]), true);
  assert.equal(await writeJSONIfChanged(file, [{ id: 'a' }]), false);
  assert.equal(await readFile(file, 'utf8'), '[\n  {\n    "id": "a"\n  }\n]\n');
});
