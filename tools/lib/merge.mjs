export function mergeEntries(existing, incoming) {
  const known = new Set(existing.map((entry) => entry.id));
  const added = [];
  for (const item of incoming) {
    if (!item || typeof item.id !== 'string' || known.has(item.id)) continue;
    known.add(item.id);
    added.push(item);
  }
  const list = [...existing, ...added].sort((a, b) => new Date(b.date) - new Date(a.date));
  return { list, added };
}
