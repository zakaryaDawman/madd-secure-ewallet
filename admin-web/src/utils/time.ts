/** Time of day for lists, e.g. "9:42 AM". */
export function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
