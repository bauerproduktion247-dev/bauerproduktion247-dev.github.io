function bestUrl(media) {
  return media?.sizes?.full?.mediaUrl ?? media?.sizes?.large?.mediaUrl ?? media?.mediaUrl ?? null;
}

export function parseBeholdFeed(json) {
  const posts = Array.isArray(json) ? json : Array.isArray(json?.posts) ? json.posts : null;
  if (!posts) throw new Error('Unbekanntes Behold-Format');
  const out = [];
  for (const post of posts) {
    const base = {
      date: post.timestamp,
      caption: post.prunedCaption ?? post.caption ?? '',
      permalink: post.permalink ?? null,
    };
    if (post.mediaType === 'IMAGE') {
      out.push({ ...base, id: `ig_${post.id}`, imageUrl: bestUrl(post) });
    } else if (post.mediaType === 'CAROUSEL_ALBUM') {
      for (const child of post.children ?? []) {
        if (child.mediaType !== 'IMAGE') continue;
        out.push({ ...base, id: `ig_${child.id}`, imageUrl: bestUrl(child) });
      }
    }
  }
  return out.filter((item) => item.imageUrl && item.date);
}
