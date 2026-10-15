import { copyFile, mkdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const nm = join(here, 'node_modules');

const required = [
  ['gsap/dist/gsap.min.js', 'vendor/gsap/gsap.min.js'],
  ['gsap/dist/ScrollTrigger.min.js', 'vendor/gsap/ScrollTrigger.min.js'],
  ['gsap/dist/DrawSVGPlugin.min.js', 'vendor/gsap/DrawSVGPlugin.min.js'],
  ['lenis/dist/lenis.min.js', 'vendor/lenis/lenis.min.js'],
  ['@fontsource/montserrat/files/montserrat-latin-200-normal.woff2', 'vendor/fonts/montserrat-200.woff2'],
  ['@fontsource/montserrat/files/montserrat-latin-300-normal.woff2', 'vendor/fonts/montserrat-300.woff2'],
  ['@fontsource/inter/files/inter-latin-400-normal.woff2', 'vendor/fonts/inter-400.woff2'],
  ['@fontsource/inter/files/inter-latin-600-normal.woff2', 'vendor/fonts/inter-600.woff2'],
];
const licenses = [
  ['@fontsource/montserrat/LICENSE', 'vendor/fonts/LICENSE-Montserrat.txt'],
  ['@fontsource/inter/LICENSE', 'vendor/fonts/LICENSE-Inter.txt'],
  ['lenis/LICENSE', 'vendor/lenis/LICENSE.txt'],
];

async function copy(from, to) {
  await mkdir(dirname(join(root, to)), { recursive: true });
  await copyFile(join(nm, from), join(root, to));
  console.log(`✓ ${to}`);
}

for (const [from, to] of required) await copy(from, to);
for (const [from, to] of licenses) {
  try {
    await access(join(nm, from));
    await copy(from, to);
  } catch {
    console.log(`– Lizenzdatei fehlt im Paket: ${from}`);
  }
}
