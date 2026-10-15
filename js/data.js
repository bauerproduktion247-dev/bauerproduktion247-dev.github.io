export function dataBase(search = globalThis.location?.search ?? '') {
  return new URLSearchParams(search).has('dev') ? 'dev-data/' : 'data/';
}

export async function loadJSON(url, fallback = null) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

export function visible(list, hiddenIds = []) {
  if (!Array.isArray(list)) return [];
  const hidden = new Set(Array.isArray(hiddenIds) ? hiddenIds : []);
  return list.filter((item) => item && typeof item.id === 'string' && !hidden.has(item.id));
}

export function firstPage(list, pages, size) {
  return list.slice(0, Math.max(1, pages) * size);
}

export function altText(caption, fallback = 'Foto von Bauer Produktion') {
  if (typeof caption !== 'string') return fallback;
  const text = caption
    .replace(/#[\p{L}\p{N}_]+/gu, '')
    .replace(/@[\w.]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return fallback;
  return text.length > 120 ? `${text.slice(0, 119).trimEnd()}…` : text;
}

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function tileSize(w, h) {
  if (!w || !h) return 'std';
  const ratio = w / h;
  if (ratio >= 1.3) return 'wide';
  if (ratio <= 0.85) return 'tall';
  return 'std';
}

export function splitGallery(photos, stripCount) {
  return { strip: photos.slice(0, stripCount), archive: photos.slice(stripCount) };
}
