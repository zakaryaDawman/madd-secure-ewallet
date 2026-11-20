/**
 * Turns search text into an ILIKE pattern that matches it anywhere, with %, _ and \ made plain text
 * (so typing "%" doesn't match everything). The pattern is always passed to SQL as a value, never pasted in.
 */
export function containsPattern(text: string): string {
  return `%${text.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
