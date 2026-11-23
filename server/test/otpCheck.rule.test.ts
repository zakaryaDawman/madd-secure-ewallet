import { otpState, resendState, type OtpRecord } from '../src/rules/otpCheck';

const NOW = new Date('2026-11-24T10:00:00Z');

/** A fresh code sent 10 seconds ago; each test changes one thing. */
function code(change: Partial<OtpRecord> = {}): OtpRecord {
  return { expiresAt: new Date(NOW.getTime() + 290_000), usedAt: null, attempts: 0, sends: 1, lastSentAt: new Date(NOW.getTime() - 10_000), ...change };
}

describe('otpState (G4)', () => {
  it('a fresh code can be tried 5 times', () => {
    expect(otpState(code(), NOW)).toEqual({ usable: true, triesLeft: 5 });
  });

  it('counts down the tries left', () => {
    expect(otpState(code({ attempts: 4 }), NOW)).toEqual({ usable: true, triesLeft: 1 });
  });

  it('locks on exactly the 5th wrong try', () => {
    expect(otpState(code({ attempts: 5 }), NOW)).toEqual({ usable: false, reason: 'locked' });
  });

  it('expires exactly at expires_at, not a moment before', () => {
    expect(otpState(code({ expiresAt: new Date(NOW.getTime() + 1) }), NOW).usable).toBe(true);
    expect(otpState(code({ expiresAt: NOW }), NOW)).toEqual({ usable: false, reason: 'expired' });
  });

  it('a used code never works again, even before it expires', () => {
    expect(otpState(code({ usedAt: NOW }), NOW)).toEqual({ usable: false, reason: 'used' });
  });
});

describe('resendState (G4)', () => {
  it('refuses within 60 seconds and says how long to wait', () => {
    expect(resendState(code(), NOW)).toEqual({ allowed: false, reason: 'cooldown', secondsLeft: 50 });
  });

  it('allows exactly 60 seconds after the last email', () => {
    expect(resendState(code({ lastSentAt: new Date(NOW.getTime() - 60_000) }), NOW)).toEqual({ allowed: true });
  });

  it('refuses after 3 emails, even after the wait', () => {
    expect(resendState(code({ sends: 3, lastSentAt: new Date(NOW.getTime() - 600_000) }), NOW)).toEqual({ allowed: false, reason: 'limit' });
    expect(resendState(code({ sends: 2, lastSentAt: new Date(NOW.getTime() - 600_000) }), NOW)).toEqual({ allowed: true });
  });
});
