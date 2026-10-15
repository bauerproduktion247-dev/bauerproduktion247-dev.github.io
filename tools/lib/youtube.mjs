export const rssUrl = (channelId) => `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
export const shortsUrl = (videoId) => `https://www.youtube.com/shorts/${videoId}`;
export const thumbUrls = (videoId) => [
  `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
];

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&');

export function parseYouTubeRss(xml) {
  return xml.split('<entry>').slice(1).map((entry) => {
    const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(entry)?.[1];
    const title = /<title>([^<]*)<\/title>/.exec(entry)?.[1] ?? '';
    const date = /<published>([^<]+)<\/published>/.exec(entry)?.[1];
    return id && date ? { id, title: decode(title), date } : null;
  }).filter(Boolean);
}

export async function isShort(videoId, fetchFn = fetch) {
  const res = await fetchFn(shortsUrl(videoId), { method: 'HEAD', redirect: 'manual' });
  if (res.status === 200) return true;
  if (res.status >= 300 && res.status < 400) return false;
  // Alles andere (Rate-Limit, Serverfehler …) ist keine Antwort – lieber morgen erneut prüfen.
  throw new Error(`Shorts-Prüfung: HTTP ${res.status}`);
}
