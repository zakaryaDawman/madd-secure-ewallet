import { ruleConfig } from './config';

/** What the server knows about one emailed code (never the code itself). */
export type OtpRecord = { expiresAt: Date; usedAt: Date | null; attempts: number; sends: number; lastSentAt: Date };

/** Whether a code may still be tried, and how many wrong tries are left. */
export type OtpState = { usable: true; triesLeft: number } | { usable: false; reason: 'used' | 'expired' | 'locked' };

/** Whether a new code may be emailed now. */
export type ResendState = { allowed: true } | { allowed: false; reason: 'cooldown'; secondsLeft: number } | { allowed: false; reason: 'limit' };

/**
 * Can this code still be tried? (pure function, no database). A used code never works again, an old one expires
 * after 5 minutes, and 5 wrong tries lock it for good.
 */
export function otpState(record: OtpRecord, now: Date): OtpState {
  if (record.usedAt) return { usable: false, reason: 'used' };
  if (record.attempts >= ruleConfig.otpMaxTries) return { usable: false, reason: 'locked' };
  if (now.getTime() >= record.expiresAt.getTime()) return { usable: false, reason: 'expired' };
  return { usable: true, triesLeft: ruleConfig.otpMaxTries - record.attempts };
}

/** May we email a new code? (pure function). Not within 60 seconds of the last one, and at most 3 emails per code. */
export function resendState(record: OtpRecord, now: Date): ResendState {
  if (record.sends >= ruleConfig.otpMaxSends) return { allowed: false, reason: 'limit' };
  const waitMs = record.lastSentAt.getTime() + ruleConfig.otpResendSeconds * 1000 - now.getTime();
  if (waitMs > 0) return { allowed: false, reason: 'cooldown', secondsLeft: Math.ceil(waitMs / 1000) };
  return { allowed: true };
}
