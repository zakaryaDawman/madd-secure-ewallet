import { ruleConfig } from './config';
import type { RuleResult } from './ruleResult';

const MINUTE_MS = 60_000;

/** One login try: did it succeed, and when. */
export type LoginAttempt = { success: boolean; at: Date };

/**
 * R4 Failed logins (FR-14). Fires at 5 or more wrong logins within the last 15 minutes.
 * A successful login in between does not reset the count, so an attacker can't wipe it.
 */
export function checkFailedLogins(attempts: LoginAttempt[], now: Date): RuleResult<FailedLoginsDetails> {
  const windowStart = now.getTime() - ruleConfig.failedLoginWindowMinutes * MINUTE_MS;
  const failureTimes = attempts.filter((a) => !a.success && a.at.getTime() > windowStart).map((a) => a.at.getTime());
  const failures = failureTimes.length;
  const details = {
    failures,
    maxFailures: ruleConfig.failedLoginMax,
    windowMinutes: ruleConfig.failedLoginWindowMinutes,
    spanSeconds: failures === 0 ? 0 : Math.round((now.getTime() - Math.min(...failureTimes)) / 1000),
  };

  if (failures >= ruleConfig.failedLoginMax) {
    return { fired: true, reason: `${failures} wrong logins in ${ruleConfig.failedLoginWindowMinutes} minutes.`, details };
  }
  return { fired: false, reason: `${failures} wrong logins in the last ${ruleConfig.failedLoginWindowMinutes} minutes.`, details };
}

/** The numbers R4 used: wrong logins counted, the limit, the window, and how long they actually took. */
export type FailedLoginsDetails = { failures: number; maxFailures: number; windowMinutes: number; spanSeconds: number };
