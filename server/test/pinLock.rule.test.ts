import { PinAttempt, pinLockState } from '../src/rules/pinLock';

const START = new Date('2026-11-20T10:00:00Z');

/** A time `minutes` after START. */
function at(minutes: number): Date {
  return new Date(START.getTime() + minutes * 60_000);
}

/** `count` wrong PINs, one a minute, starting at START. */
function wrongTries(count: number): PinAttempt[] {
  return Array.from({ length: count }, (_, i) => ({ success: false, at: at(i) }));
}

describe('pinLockState (pure rule)', () => {
  it('gives 5 tries when there are no attempts', () => {
    expect(pinLockState([], START)).toEqual({ locked: false, triesLeft: 5 });
  });

  it('counts down: 3 wrong PINs leave 2 tries', () => {
    expect(pinLockState(wrongTries(3), at(3))).toEqual({ locked: false, triesLeft: 2 });
  });

  it('4 wrong PINs leave 1 try', () => {
    expect(pinLockState(wrongTries(4), at(4))).toEqual({ locked: false, triesLeft: 1 });
  });

  it('locks at the 5th wrong PIN until 15 minutes after it', () => {
    expect(pinLockState(wrongTries(5), at(4))).toEqual({ locked: true, unlocksAt: at(19) });
  });

  it('is still locked at 14:59 after the 5th wrong PIN', () => {
    expect(pinLockState(wrongTries(5), at(4 + 14.99)).locked).toBe(true);
  });

  it('unlocks exactly 15 minutes after the 5th wrong PIN, with 5 fresh tries', () => {
    expect(pinLockState(wrongTries(5), at(19))).toEqual({ locked: false, triesLeft: 5 });
  });

  it('a right PIN resets the count', () => {
    const attempts = [...wrongTries(4), { success: true, at: at(4) }, { success: false, at: at(5) }];
    expect(pinLockState(attempts, at(5))).toEqual({ locked: false, triesLeft: 4 });
  });

  it('forgets wrong PINs after 15 quiet minutes', () => {
    const attempts = [...wrongTries(4), { success: false, at: at(3 + 15) }];
    expect(pinLockState(attempts, at(18))).toEqual({ locked: false, triesLeft: 4 });
  });
});
