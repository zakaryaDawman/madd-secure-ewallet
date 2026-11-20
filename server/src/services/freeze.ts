import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { isTrustedDevice } from './devices';
import { endAllSessions } from './sessions';
import { logSecurityEvent } from './securityLog';

/**
 * Freezes the account: cancels every held transfer, sets frozen_at and ends every session on every phone, then logs it.
 * Runs inside the caller's database transaction. Used by "No, freeze my account" on a held transfer and on a new device alert.
 */
export async function freezeAccount(client: PoolClient, userId: number, reason: string): Promise<void> {
  await client.query("UPDATE transactions SET status = 'CANCELLED' WHERE sender_id = $1 AND status = 'PENDING'", [userId]);
  await client.query('UPDATE users SET frozen_at = now() WHERE id = $1 AND frozen_at IS NULL', [userId]);
  await endAllSessions(client, userId, 'freeze');
  await logSecurityEvent({ userId, type: 'ACCOUNT_FROZEN', reason }, client);
}

/**
 * The owner freezes their own account from a trusted phone ("No, freeze my account" on the new device alert,
 * "Freeze my account" on a lock item in the Inbox). Returns false, and changes nothing, on an untrusted phone.
 */
export async function freezeByOwner(caller: { userId: number; deviceId: string }, reason: string): Promise<boolean> {
  if (!(await isTrustedDevice(caller.userId, caller.deviceId))) return false;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await freezeAccount(client, caller.userId, reason);
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
