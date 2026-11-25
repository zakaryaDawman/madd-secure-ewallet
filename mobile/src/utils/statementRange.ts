/** The date ranges on the Statement screen (task G12). */
export type RangeChoice = 'thisMonth' | 'lastMonth' | 'last3Months' | 'custom';

const TIME_ZONE = 'Asia/Kuala_Lumpur';

/** Today's date in Malaysia as YYYY-MM-DD. */
export function todayMY(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

/** YYYY-MM-DD for a year, month (1–12) and day; day 0 means the last day of the month before. */
function ymd(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/** The from / to dates for a preset range, counted in Malaysian dates. */
export function presetRange(choice: Exclude<RangeChoice, 'custom'>): { from: string; to: string } {
  const today = todayMY();
  const [year, month] = today.split('-').map(Number);
  if (choice === 'thisMonth') return { from: ymd(year, month, 1), to: today };
  if (choice === 'lastMonth') return { from: ymd(year, month - 1, 1), to: ymd(year, month, 0) };
  return { from: ymd(year, month - 2, 1), to: today };
}

/** Turns "25/11/2026" into "2026-11-25", or null if it isn't a real date. */
export function parseDayMonthYear(text: string): string | null {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const iso = ymd(year, month, day);
  return iso === `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` ? iso : null;
}

/** "2026-11-25" -> "25 Nov 2026", for the statement heading. */
export function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
