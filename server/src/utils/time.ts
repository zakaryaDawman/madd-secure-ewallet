const TIME_ZONE = 'Asia/Kuala_Lumpur';

/** Time of day in Malaysia for text the server writes, e.g. "9:15 PM". */
export function timeOfDayMY(date: Date): string {
  return date.toLocaleTimeString('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' });
}
