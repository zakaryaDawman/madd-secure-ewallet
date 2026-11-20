/** Writes whole sen as Malaysian ringgit for messages, e.g. 80000 -> "RM 800.00". Whole-number maths only, no floats. */
export function formatRM(sen: number): string {
  const ringgit = Math.floor(sen / 100).toLocaleString('en-MY');
  const cents = String(sen % 100).padStart(2, '0');
  return `RM ${ringgit}.${cents}`;
}
