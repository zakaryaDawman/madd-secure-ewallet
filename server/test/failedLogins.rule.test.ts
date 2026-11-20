import { checkFailedLogins, LoginAttempt } from '../src/rules/failedLogins';

const NOW = new Date('2026-11-20T10:00:00Z');

/** A wrong (or right) login `minutes` before NOW. */
function attempt(minutes: number, success = false): LoginAttempt {
  return { success, at: new Date(NOW.getTime() - minutes * 60_000) };
}

/** `count` wrong logins, one a minute, the latest 1 minute ago. */
function failures(count: number): LoginAttempt[] {
  return Array.from({ length: count }, (_, i) => attempt(i + 1));
}

describe('R4 checkFailedLogins', () => {
  it('fires at 6 wrong logins in 15 minutes', () => {
    expect(checkFailedLogins(failures(6), NOW)).toEqual({
      fired: true,
      reason: '6 wrong logins in 15 minutes.',
      details: { failures: 6, maxFailures: 5, windowMinutes: 15, spanSeconds: 360 }, // the first was 6 minutes ago
    });
  });

  it('does not fire with no wrong logins', () => {
    expect(checkFailedLogins([attempt(1, true)], NOW).fired).toBe(false);
  });

  it('on the limit: 4 wrong logins do not fire, exactly 5 do', () => {
    expect(checkFailedLogins(failures(4), NOW).fired).toBe(false);
    expect(checkFailedLogins(failures(5), NOW).fired).toBe(true);
  });

  it('a wrong login exactly 15 minutes ago is outside the window', () => {
    expect(checkFailedLogins([...failures(4), attempt(15)], NOW).fired).toBe(false);
    expect(checkFailedLogins([...failures(4), attempt(14.99)], NOW).fired).toBe(true);
  });

  it('a successful login in between does not reset the count', () => {
    expect(checkFailedLogins([...failures(3), attempt(4.5, true), attempt(5), attempt(6)], NOW).fired).toBe(true);
  });
});
