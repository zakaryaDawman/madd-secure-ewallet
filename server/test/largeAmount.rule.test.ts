import { checkLargeAmount } from '../src/rules/largeAmount';

describe('R1 checkLargeAmount', () => {
  it('fires above RM 500 for a new user with no past transfers', () => {
    expect(checkLargeAmount(80_000, [])).toEqual({ fired: true, reason: 'RM 800 is above your safe limit of RM 500.' });
  });

  it('fires for RM 800 when the usual transfer is RM 96, with the reason shown on the Held screen', () => {
    expect(checkLargeAmount(80_000, [9_600, 9_600])).toEqual({
      fired: true,
      reason: 'RM 800 is more than 3 times your usual transfer, and above your safe limit of RM 500.',
    });
  });

  it('does not fire for a small amount', () => {
    expect(checkLargeAmount(5_000, [2_000, 3_000]).fired).toBe(false);
  });

  it('on the RM 500 limit: exactly RM 500.00 does not fire, RM 500.01 does', () => {
    expect(checkLargeAmount(50_000, []).fired).toBe(false);
    expect(checkLargeAmount(50_001, []).fired).toBe(true);
  });

  it('does not fire above RM 500 when the user usually sends big amounts', () => {
    // average RM 400, so the limit is 3 × 400 = RM 1,200
    expect(checkLargeAmount(100_000, [40_000, 40_000]).fired).toBe(false);
  });

  it('on the 3 × average limit: exactly 3 × does not fire, 1 sen more does', () => {
    expect(checkLargeAmount(120_000, [40_000, 40_000]).fired).toBe(false);
    expect(checkLargeAmount(120_001, [40_000, 40_000]).fired).toBe(true);
  });

  it('uses whole numbers, so an average with a fraction (RM 333.33…) is still exact', () => {
    // sum 100,000 sen over 3 transfers: 3 × average = 100,000 sen exactly
    expect(checkLargeAmount(100_000, [33_333, 33_333, 33_334]).fired).toBe(false);
    expect(checkLargeAmount(100_001, [33_333, 33_333, 33_334]).fired).toBe(true);
  });
});
