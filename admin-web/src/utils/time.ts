/** Time of day for lists, e.g. "9:42 AM". */
export function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Exact time with seconds, 24-hour, for timelines, e.g. "21:42:07". */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour12: false });
}

/** The day heading for a list, e.g. "Today", "Yesterday" or "18 Nov 2026". */
export function dayHeading(iso: string, now: Date = new Date()): string {
  const day = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (day.toDateString() === now.toDateString()) return 'Today';
  if (day.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
