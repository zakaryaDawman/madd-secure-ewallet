import type { KeypadKey } from '../components/MaddKeypad';

const MAX_RINGGIT_DIGITS = 5; // up to RM 99,999

/** Applies one keypad press to the typed amount text, e.g. "80" + "0" -> "800". Allows one dot and at most 2 decimals. */
export function applyAmountKey(text: string, key: KeypadKey): string {
  if (key === 'delete') return text.slice(0, -1);
  if (key === '.') return text.includes('.') ? text : (text || '0') + '.';
  const [ringgit, cents] = text.split('.');
  if (cents !== undefined) return cents.length < 2 ? text + key : text;
  if (ringgit === '0') return key; // no leading zeros
  return ringgit.length < MAX_RINGGIT_DIGITS ? text + key : text;
}

/** Converts typed amount text to whole sen, e.g. "800.5" -> 80050. Empty text is 0. */
export function amountTextToSen(text: string): number {
  if (!text) return 0;
  const [ringgit, cents = ''] = text.split('.');
  return Number(ringgit || '0') * 100 + Number(cents.padEnd(2, '0'));
}

/** Shows the typed amount with thousands separators, split for the grey-cents style, e.g. "1250.5" -> { main: "RM 1,250", cents: ".50" }. */
export function displayAmount(text: string): { main: string; cents: string } {
  const [ringgit, cents] = text.split('.');
  const main = `RM ${Number(ringgit || '0').toLocaleString('en-MY')}`;
  return { main, cents: `.${(cents ?? '').padEnd(2, '0')}` };
}
