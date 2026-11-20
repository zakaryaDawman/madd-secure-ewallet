/** Time of day for lists, e.g. "9:42 AM". */
export function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Exact time with seconds, 24-hour, for timelines, e.g. "21:42:07". */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour12: false });
}
