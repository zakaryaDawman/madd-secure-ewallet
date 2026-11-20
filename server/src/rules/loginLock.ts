import { ruleConfig } from './config';
import { checkFailedLogins, LoginAttempt } from './failedLogins';

const MINUTE_MS = 60_000;

/** Whether sign-in is paused for an email, and until when. */
export type LoginLockState = { locked: false } | { locked: true; unlocksAt: Date };

/**
 * Sign-in lock (FR-14, pure function, no database). `attempts` are the email's recent logins, oldest first.
 * At each wrong password it asks rule R4 (checkFailedLogins); the moment R4 fires, sign-in is locked for 15 minutes.
 * The lock always lasts the full 15 minutes, even when old failures leave R4's 15-minute window.
 */
export function loginLockState(attempts: LoginAttempt[], now: Date): LoginLockState {
  let unlocksAt: Date | null = null;
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const duringLock = unlocksAt !== null && attempt.at < unlocksAt;
    if (attempt.success || duringLock) continue;
    // Only failures since the last lock ended count towards a new lock.
    const sinceLastLock = attempts.slice(0, i + 1).filter((a) => unlocksAt === null || a.at >= unlocksAt);
    if (checkFailedLogins(sinceLastLock, attempt.at).fired) {
      unlocksAt = new Date(attempt.at.getTime() + ruleConfig.lockMinutes * MINUTE_MS);
    }
  }
  if (unlocksAt !== null && now < unlocksAt) return { locked: true, unlocksAt };
  return { locked: false };
}
