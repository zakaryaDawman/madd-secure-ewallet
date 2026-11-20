/** Writes whole sen as ringgit for messages, e.g. 80000 -> "RM 800", 1250 -> "RM 12.50". Whole-number maths only, no floats. */
export function formatRM(sen: number): string {
  const ringgit = Math.floor(sen / 100).toLocaleString('en-MY');
  const cents = sen % 100;
  return cents === 0 ? `RM ${ringgit}` : `RM ${ringgit}.${String(cents).padStart(2, '0')}`;
}
