import { checkVelocity } from '../src/rules/velocity';

const NOW = new Date('2026-11-20T10:00:00Z');

/** A time `minutes` before NOW. */
function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60_000);
}

describe('R2 checkVelocity', () => {
  it('fires for the 5th transfer in 5 minutes', () => {
    const result = checkVelocity([minutesAgo(1), minutesAgo(2), minutesAgo(3), minutesAgo(4)], NOW);
    expect(result).toEqual({
      fired: true,
      reason: '5 transfers in 5 minutes is faster than usual.',
      details: { count: 5, maxTransfers: 3, windowMinutes: 5, spanSeconds: 240 }, // the first was 4 minutes ago
    });
  });

  it('does not fire for the first transfer', () => {
    expect(checkVelocity([], NOW).fired).toBe(false);
  });

  it('on the limit: the 3rd transfer does not fire, the 4th does', () => {
    expect(checkVelocity([minutesAgo(1), minutesAgo(2)], NOW).fired).toBe(false);
    expect(checkVelocity([minutesAgo(1), minutesAgo(2), minutesAgo(3)], NOW).fired).toBe(true);
  });

  it('a transfer exactly 5 minutes ago is outside the window', () => {
    expect(checkVelocity([minutesAgo(1), minutesAgo(2), minutesAgo(5)], NOW).fired).toBe(false);
    expect(checkVelocity([minutesAgo(1), minutesAgo(2), minutesAgo(4.99)], NOW).fired).toBe(true);
  });
});
