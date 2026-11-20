import type { PoolClient } from 'pg';
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
