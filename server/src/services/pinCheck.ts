import bcrypt from 'bcrypt';
import { pool } from '../db/pool';
import { PinAttempt, pinLockState } from '../rules/pinLock';
import { ruleConfig } from '../rules/config';
import { logSecurityEvent } from './securityLog';
import { notify } from './notify';

/** Result of checking a PIN with the wrong-PIN lock. */
export type PinCheck =
  | { ok: true }
  | { ok: false; error: 'wrong_pin'; triesLeft: number }
  | { ok: false; error: 'pin_locked'; unlocksAt: Date };

/**
 * Checks the user's PIN, counting wrong tries (task C4). While transfers are locked the PIN is not even
 * compared, so nobody can keep guessing. The 5th wrong PIN in a row starts the 15-minute lock.
 */
export async function checkPin(userId: number, pin: string): Promise<PinCheck> {
  const attempts = await latestPinAttempts(userId);
  const before = pinLockState(attempts, new Date());
  if (before.locked) return { ok: false, error: 'pin_locked', unlocksAt: before.unlocksAt };

  const success = await pinMatches(userId, pin);
  const at = await recordPinAttempt(userId, success);
  if (success) return { ok: true };

  const after = pinLockState([...attempts, { success, at }], at);
  if (!after.locked) return { ok: false, error: 'wrong_pin', triesLeft: after.triesLeft };
  await notify({ userId, kind: 'PIN_LOCKED' });
  await logSecurityEvent({ userId, type: 'PIN_LOCKED', reason: `${ruleConfig.pinMaxTries} wrong PINs in a row. Transfers locked for ${ruleConfig.lockMinutes} minutes.` });
  return { ok: false, error: 'pin_locked', unlocksAt: after.unlocksAt };
}

/** True if the PIN matches the one saved (as a bcrypt hash) for this user. */
async function pinMatches(userId: number, pin: string): Promise<boolean> {
  const { rows } = await pool.query<{ pin_hash: string }>('SELECT pin_hash FROM users WHERE id = $1', [userId]);
  return rows.length > 0 && bcrypt.compare(pin, rows[0].pin_hash);
}

/** The user's last few PIN checks, oldest first. Only the last 5 can affect the lock. */
async function latestPinAttempts(userId: number): Promise<PinAttempt[]> {
  const { rows } = await pool.query<{ success: boolean; created_at: Date }>(
    'SELECT success, created_at FROM pin_attempts WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2',
    [userId, ruleConfig.pinMaxTries],
  );
  return rows.reverse().map((r) => ({ success: r.success, at: r.created_at }));
}

/** Saves one PIN check (right or wrong) and returns its database time. The PIN itself is never stored. */
async function recordPinAttempt(userId: number, success: boolean): Promise<Date> {
  const { rows } = await pool.query<{ created_at: Date }>(
    'INSERT INTO pin_attempts (user_id, success) VALUES ($1, $2) RETURNING created_at',
    [userId, success],
  );
  return rows[0].created_at;
}
