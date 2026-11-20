import { loginLockState } from '../src/rules/loginLock';
import type { LoginAttempt } from '../src/rules/failedLogins';

const START = new Date('2026-11-20T10:00:00Z');

/** A time `minutes` after START. */
function at(minutes: number): Date {
  return new Date(START.getTime() + minutes * 60_000);
}

/** `count` wrong passwords, one a minute, starting at START. */
function wrongPasswords(count: number): LoginAttempt[] {
  return Array.from({ length: count }, (_, i) => ({ success: false, at: at(i) }));
}

describe('loginLockState (pure rule)', () => {
  it('4 wrong passwords do not lock', () => {
    expect(loginLockState(wrongPasswords(4), at(4))).toEqual({ locked: false });
  });

  it('the 5th wrong password locks sign-in for 15 minutes from that moment', () => {
    expect(loginLockState(wrongPasswords(5), at(4))).toEqual({ locked: true, unlocksAt: at(19) });
  });

  it('is still locked at 14:59 and unlocked at 15:00', () => {
    expect(loginLockState(wrongPasswords(5), at(4 + 14.99)).locked).toBe(true);
    expect(loginLockState(wrongPasswords(5), at(19)).locked).toBe(false);
  });

  it('keeps the full 15 minutes even after the first failures leave the 15-minute window', () => {
    // failures at 0..4 min; at 16 min the first one is outside R4's window, but the lock (until 19 min) still holds
    expect(loginLockState(wrongPasswords(5), at(16)).locked).toBe(true);
  });

  it('wrong passwords more than 15 minutes apart do not add up', () => {
    const spread = [0, 16, 32, 48, 64].map((m) => ({ success: false, at: at(m) }));
    expect(loginLockState(spread, at(64)).locked).toBe(false);
  });

  it('a right password in between does not reset the count (rule R4)', () => {
    const attempts = [...wrongPasswords(3), { success: true, at: at(3) }, { success: false, at: at(4) }, { success: false, at: at(5) }];
    expect(loginLockState(attempts, at(5)).locked).toBe(true);
  });

  it('after a lock ends, it takes 5 new wrong passwords to lock again', () => {
    const attempts = [...wrongPasswords(5), { success: false, at: at(20) }];
    expect(loginLockState(attempts, at(20)).locked).toBe(false);
  });
});
