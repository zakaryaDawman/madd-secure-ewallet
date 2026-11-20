import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { isTrustedDevice } from './devices';
import { endAllSessions } from './sessions';
import { logSecurityEvent } from './securityLog';
import { checkPin, isPinLocked, PinCheck } from './pinCheck';

/**
 * Where a freeze came from, saved with it so the admin sees "Frozen by" and "Trigger" before unfreezing (design 25).
 * `transactionId` is the held transfer the owner said No to.
 */
export type FreezeSource =
  | { source: 'held_transfer'; transactionId: number }
  | { source: 'new_device_alert' }
  | { source: 'freeze_my_account' }
  | { source: 'admin' };

/**
 * Freezes the account: cancels every held transfer, sets frozen_at and ends every session on every phone, then logs it.
 * Runs inside the caller's database transaction. Used by every freeze: Yes/No on a held transfer, the new device alert,
 * the Inbox and Profile.
 */
export async function freezeAccount(client: PoolClient, userId: number, reason: string, source: FreezeSource): Promise<void> {
  await client.query("UPDATE transactions SET status = 'CANCELLED' WHERE sender_id = $1 AND status = 'PENDING'", [userId]);
  await client.query('UPDATE users SET frozen_at = now() WHERE id = $1 AND frozen_at IS NULL', [userId]);
  await endAllSessions(client, userId, 'freeze');
  await logSecurityEvent({ userId, type: 'ACCOUNT_FROZEN', reason, details: source }, client);
}

type Caller = { userId: number; deviceId: string };

/** Why freezing from Profile was refused: the PIN is needed (not locked, not a trusted phone), or the PIN check failed. */
export type ProfileFreezeResult = { ok: true } | { ok: false; error: 'pin_required' } | Exclude<PinCheck, { ok: true }>;

/**
 * The owner freezes their own account from a trusted phone ("No, freeze my account" on the new device alert,
 * "Freeze my account" on a lock item in the Inbox). Returns false, and changes nothing, on an untrusted phone.
 */
export async function freezeByOwner(caller: Caller, reason: string): Promise<boolean> {
  if (!(await isTrustedDevice(caller.userId, caller.deviceId))) return false;
  await freezeNow(caller.userId, reason, { source: 'new_device_alert' });
  return true;
}

/**
 * "Freeze my account" in Profile (design 30). With the PIN it works on any of the owner's phones (a lost usual phone
 * must not stop them). Without a PIN it is allowed only while the PIN is locked, or from a trusted phone.
 */
export async function freezeFromProfile(caller: Caller, pin: string | undefined): Promise<ProfileFreezeResult> {
  if (pin !== undefined) {
    const check = await checkPin(caller.userId, pin);
    if (!check.ok) return check;
  } else if (!(await isPinLocked(caller.userId)) && !(await isTrustedDevice(caller.userId, caller.deviceId))) {
    return { ok: false, error: 'pin_required' };
  }
  await freezeNow(caller.userId, 'Account frozen by the owner from Profile. Every session was ended.', { source: 'freeze_my_account' });
  return { ok: true };
}

/** Freezes the account in its own database transaction (see freezeAccount). */
async function freezeNow(userId: number, reason: string, source: FreezeSource): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await freezeAccount(client, userId, reason, source);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
