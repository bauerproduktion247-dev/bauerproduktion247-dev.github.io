import { appendFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readJSON, writeJSONIfChanged } from './lib/store.mjs';
import { mergeEntries } from './lib/merge.mjs';
import { parseBeholdFeed } from './lib/instagram.mjs';
import { processImage } from './lib/images.mjs';
import { parseYouTubeRss, isShort, rssUrl, thumbUrls } from './lib/youtube.mjs';
import { listManualFiles } from './lib/manual.mjs';

export const CHANNEL_ID = 'UCIxu3ooS7E4l_XP2ptHnZKw';

async function download(url, fetchFn) {
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function firstAvailable(urls, fetchFn) {
  let lastError;
  for (const url of urls) {
    try {
      return await download(url, fetchFn);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

function photoEntry(item, files, source) {
  return {
    id: item.id,
    source,
    date: item.date,
    caption: item.caption ?? '',
    permalink: item.permalink ?? null,
    src: `media/photos/${files.src}`,
    thumb: `media/photos/${files.thumb}`,
    w: files.w,
    h: files.h,
  };
}

async function collectInstagram({ beholdUrl, fetchFn, known, photoDir, errors, outages, log }) {
  const added = [];
  if (!beholdUrl) {
    log.warn('BEHOLD_FEED_URL fehlt – Instagram wird übersprungen.');
    outages.push({ source: 'Instagram', reason: 'BEHOLD_FEED_URL fehlt (Secret nicht gesetzt)' });
    return added;
  }
  let items;
  try {
    const res = await fetchFn(beholdUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    items = parseBeholdFeed(await res.json());
  } catch (err) {
    errors.push(`Instagram: ${err.message}`);
    outages.push({ source: 'Instagram', reason: err.message });
    return added;
  }
  for (const item of items) {
    if (known.has(item.id)) continue;
    try {
      const files = await processImage(await download(item.imageUrl, fetchFn), item.id, photoDir);
      added.push(photoEntry(item, files, 'instagram'));
      known.add(item.id);
    } catch (err) {
      errors.push(`Instagram ${item.id}: ${err.message}`);
    }
  }
  return added;
}

async function collectManual({ manualDir, known, photoDir, errors }) {
  const added = [];
  for (const item of await listManualFiles(manualDir)) {
    if (known.has(item.id)) continue;
    try {
      const files = await processImage(item.file, item.id, photoDir);
      added.push(photoEntry(item, files, 'manual'));
      known.add(item.id);
    } catch (err) {
      errors.push(`Manuell ${item.id}: ${err.message}`);
    }
  }
  return added;
}

async function collectYouTube({ channelId, fetchFn, known, videoDir, errors, outages }) {
  const added = [];
  let entries;
  try {
    const res = await fetchFn(rssUrl(channelId));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    entries = parseYouTubeRss(await res.text());
  } catch (err) {
    errors.push(`YouTube: ${err.message}`);
    outages.push({ source: 'YouTube', reason: err.message });
    return added;
  }
  for (const video of entries) {
    if (known.has(video.id)) continue;
    try {
      if (await isShort(video.id, fetchFn)) continue;
      const files = await processImage(await firstAvailable(thumbUrls(video.id), fetchFn), `yt_${video.id}`, videoDir);
      added.push({
        id: video.id,
        title: video.title,
        date: video.date,
        thumb: `media/videos/${files.src}`,
        thumbSmall: `media/videos/${files.thumb}`,
      });
      known.add(video.id);
    } catch (err) {
      errors.push(`YouTube ${video.id}: ${err.message}`);
    }
  }
  return added;
}

export async function runSync({ root, beholdUrl, channelId = CHANNEL_ID, fetchFn = fetch, log = console }) {
  const photosFile = join(root, 'data', 'photos.json');
  const videosFile = join(root, 'data', 'videos.json');
  const photos = await readJSON(photosFile, []);
  const videos = await readJSON(videosFile, []);
  const errors = [];
  const outages = [];
  const photoDir = join(root, 'media', 'photos');
  const knownPhotos = new Set(photos.map((p) => p.id));

  const newPhotos = [
    ...(await collectInstagram({ beholdUrl, fetchFn, known: knownPhotos, photoDir, errors, outages, log })),
    ...(await collectManual({ manualDir: join(root, 'manual'), known: knownPhotos, photoDir, errors })),
  ];
  const newVideos = await collectYouTube({
    channelId, fetchFn, known: new Set(videos.map((v) => v.id)), videoDir: join(root, 'media', 'videos'), errors, outages,
  });

  const photosChanged = await writeJSONIfChanged(photosFile, mergeEntries(photos, newPhotos).list);
  const videosChanged = await writeJSONIfChanged(videosFile, mergeEntries(videos, newVideos).list);
  for (const message of errors) log.error(message);
  return {
    addedPhotos: newPhotos.length,
    addedVideos: newVideos.length,
    errors,
    outages,
    failedSources: outages.map((o) => o.source),
    changed: photosChanged || videosChanged,
  };
}

/** Markdown für $GITHUB_STEP_SUMMARY – leer, solange keine ganze Quelle ausgefallen ist. */
export function stepSummary(result) {
  if (!result.outages.length) return '';
  return [
    '## ⚠️ Sync: Quelle ausgefallen',
    '',
    'Bestehende Inhalte bleiben erhalten, aber von diesen Quellen kam heute nichts Neues:',
    '',
    ...result.outages.map((o) => `- **${o.source}:** ${o.reason}`),
    '',
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const ci = Boolean(process.env.GITHUB_ACTIONS);
  const log = {
    info: (m) => console.log(m),
    warn: (m) => console.log(ci ? `::warning::${m}` : `WARNUNG: ${m}`),
    error: (m) => console.log(ci ? `::warning::${m}` : `FEHLER: ${m}`),
  };
  const result = await runSync({ root, beholdUrl: process.env.BEHOLD_FEED_URL, log });
  const summary = stepSummary(result);
  if (summary && process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(`Neue Bilder: ${result.addedPhotos} · neue Videos: ${result.addedVideos} · Probleme: ${result.errors.length}`);
}
