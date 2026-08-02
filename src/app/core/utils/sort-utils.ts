export type SortDir = 'asc' | 'desc';

export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const sa = String(a).toLowerCase();
  const sb = String(b).toLowerCase();
  return sa.localeCompare(sb, 'es');
}

export function sortItems<T>(items: T[], key: (item: T) => unknown, dir: SortDir): T[] {
  const factor = dir === 'asc' ? 1 : -1;
  return [...items].sort((x, y) => factor * compareValues(key(x), key(y)));
}
