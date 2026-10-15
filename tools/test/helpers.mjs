import sharp from 'sharp';

export const beholdFeed = {
  username: 'bauer_rp',
  posts: [
    {
      id: '111', timestamp: '2026-10-10T12:00:00Z', permalink: 'https://www.instagram.com/p/AAA/',
      mediaType: 'IMAGE', mediaUrl: 'https://cdn.test/111.jpg', prunedCaption: 'Shooting #gta <b>',
      sizes: { full: { mediaUrl: 'https://cdn.test/111-full.jpg', width: 1080, height: 1350 } },
    },
    {
      id: '222', timestamp: '2026-10-11T12:00:00Z', permalink: 'https://www.instagram.com/p/BBB/',
      mediaType: 'CAROUSEL_ALBUM', caption: 'Album',
      children: [
        { id: '222a', mediaType: 'IMAGE', mediaUrl: 'https://cdn.test/222a.jpg' },
        { id: '222b', mediaType: 'VIDEO', mediaUrl: 'https://cdn.test/222b.mp4' },
        { id: '222c', mediaType: 'IMAGE', mediaUrl: 'https://cdn.test/222c.jpg', sizes: { full: { mediaUrl: 'https://cdn.test/222c-full.jpg' } } },
      ],
    },
    {
      id: '333', timestamp: '2026-10-12T12:00:00Z', permalink: 'https://www.instagram.com/p/CCC/',
      mediaType: 'VIDEO', mediaUrl: 'https://cdn.test/333.mp4', thumbnailUrl: 'https://cdn.test/333.jpg',
    },
  ],
};

export const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
<title>Bauer Produktion</title>
<published>2022-05-02T09:11:08+00:00</published>
<entry><id>yt:video:VID_LONG</id><yt:videoId>VID_LONG</yt:videoId><title>🔥 Pfister &amp; GT3 RS | Pure Carporn 🔥</title><published>2026-07-25T13:30:34+00:00</published></entry>
<entry><id>yt:video:VID_SHORT</id><yt:videoId>VID_SHORT</yt:videoId><title>Audi R8</title><published>2025-04-26T10:01:27+00:00</published></entry>
</feed>`;

export function makeImage(width, height) {
  return sharp({ create: { width, height, channels: 3, background: '#777777' } }).jpeg().toBuffer();
}

export const json = (obj) => () => new Response(JSON.stringify(obj), { status: 200, headers: { 'content-type': 'application/json' } });
export const text = (str) => () => new Response(str, { status: 200 });
export const bytes = (buf) => () => new Response(buf, { status: 200 });
export const status = (code) => () => new Response(null, { status: code });

export function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, opts = {}) => {
    calls.push({ url, method: opts.method ?? 'GET' });
    const route = routes[url];
    if (route === undefined) return new Response('not found', { status: 404 });
    if (route instanceof Error) throw route;
    return route(opts);
  };
  fn.calls = calls;
  return fn;
}

export function memoryLog() {
  const lines = { info: [], warn: [], error: [] };
  return { lines, info: (m) => lines.info.push(m), warn: (m) => lines.warn.push(m), error: (m) => lines.error.push(m) };
}
