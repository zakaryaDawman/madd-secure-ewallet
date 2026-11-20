import { pool } from '../db/pool';
import { ruleConfig } from '../rules/config';
import { loginLockState, LoginLockState } from '../rules/loginLock';
import { checkFailedLogins, type LoginAttempt } from '../rules/failedLogins';
import { logSecurityEvent } from './securityLog';
import { notify } from './notify';
import { alertTrustedPhones } from './push';
import { loginLockedAlert } from './pushAlerts';

/** Whether sign-in is paused for this email right now (rule R4). Works the same for emails with no account. */
export async function currentLoginLock(email: string): Promise<LoginLockState> {
  return loginLockState(await recentAttempts(email), new Date());
}

/**
 * Called right after a wrong password was recorded: if it was the one that made rule R4 fire, logs it for the account
 * and tells the owner in the Inbox and by push (an email with no account has no one to tell). Returns the lock state.
 */
export async function lockAfterFailure(email: string, deviceId: string): Promise<LoginLockState> {
  const attempts = await recentAttempts(email);
  const now = new Date();
  const lock = loginLockState(attempts, now);
  if (lock.locked) {
    const { rows } = await pool.query<{ id: number }>('SELECT id FROM users WHERE email = $1', [email]);
    if (rows[0]) {
      await logSecurityEvent({
        userId: rows[0].id,
        type: 'RULE_FIRED',
        rule: 'R4',
        reason: `${ruleConfig.failedLoginMax} wrong passwords in ${ruleConfig.failedLoginWindowMinutes} minutes. Sign-in locked for ${ruleConfig.lockMinutes} minutes.`,
        details: { ...checkFailedLogins(attempts, now).details, deviceId },
      });
      await notify({ userId: rows[0].id, kind: 'LOGIN_LOCKED' });
      alertTrustedPhones(rows[0].id, loginLockedAlert());
    }
  }
  return lock;
}

/** The emails whose sign-in is locked right now (rule R4), worked out with the same lock rule as the login. */
export async function lockedEmails(): Promise<Map<string, Date>> {
  const { rows } = await pool.query<{ email: string }>(
    'SELECT DISTINCT email FROM login_attempts WHERE NOT success AND created_at > now() - make_interval(mins => $1)',
    [ruleConfig.lockMinutes + ruleConfig.failedLoginWindowMinutes],
  );
  const locked = new Map<string, Date>();
  for (const { email } of rows) {
    const lock = await currentLoginLock(email);
    if (lock.locked) locked.set(email, lock.unlocksAt);
  }
  return locked;
}

/** The email's login attempts that can still matter (lock + window), oldest first. */
async function recentAttempts(email: string): Promise<LoginAttempt[]> {
  const { rows } = await pool.query<{ success: boolean; created_at: Date }>(
    `SELECT success, created_at FROM login_attempts
     WHERE email = $1 AND created_at > now() - make_interval(mins => $2)
     ORDER BY created_at, id`,
    [email, ruleConfig.lockMinutes + ruleConfig.failedLoginWindowMinutes],
  );
  return rows.map((r) => ({ success: r.success, at: r.created_at }));
}
