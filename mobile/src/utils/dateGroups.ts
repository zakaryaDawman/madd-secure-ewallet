/** A run of items that happened on the same day, with its heading. */
export type DateGroup<T> = { title: string; items: T[] };

/** Whole days between two dates, counted by calendar day (not 24-hour blocks). */
function daysBetween(earlier: Date, later: Date): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(later) - startOfDay(earlier)) / 86_400_000);
}

/** Heading for a day in History: "Today", "Yesterday" or "16 November". */
export function dayTitle(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = daysBetween(date, now);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'long' });
}

/** Splits a newest-first list into day groups, keeping the order. */
export function groupByDay<T extends { createdAt: string }>(items: T[], now: Date = new Date()): DateGroup<T>[] {
  const groups: DateGroup<T>[] = [];
  for (const item of items) {
    const title = dayTitle(item.createdAt, now);
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push(item);
    else groups.push({ title, items: [item] });
  }
  return groups;
}

/** Time of day, e.g. "1:20 PM". */
export function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
