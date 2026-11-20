/** Writes whole sen as ringgit, e.g. 124050 -> "RM 1,240.50". */
export function formatRM(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
