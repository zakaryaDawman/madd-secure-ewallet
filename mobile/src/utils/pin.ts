/** True for PINs that are easy to guess: all the same digit (111111) or counting up/down (123456, 654321). Same rule as the server. */
export function isWeakPin(pin: string): boolean {
  if (/^(\d)\1+$/.test(pin)) return true;
  const steps = [...pin].slice(1).map((d, i) => Number(d) - Number(pin[i]));
  return steps.every((s) => s === 1) || steps.every((s) => s === -1);
}
