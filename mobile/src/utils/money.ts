/** Formats sen as Malaysian ringgit, e.g. 124050 -> "RM 1,240.50". */
export function formatRM(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Splits a balance into the ringgit part and the cents, e.g. 124050 -> { main: "RM 1,240", cents: ".50" }, for the big grey-cents style. */
export function splitRM(sen: number): { main: string; cents: string } {
  const full = formatRM(sen);
  const dot = full.lastIndexOf('.');
  return { main: full.slice(0, dot), cents: full.slice(dot) };
}
