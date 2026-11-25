import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { freezeAccount } from './freeze';
import { logSecurityEvent } from './securityLog';

export type AdminActionError =
  | 'not_found'
  | 'not_frozen'
  | 'already_frozen'
  | 'already_trusted'
  | 'deactivated'
  | 'duplicate'
  | 'no_change'
  | 'balance_not_zero';
export type AdminActionResult = { ok: true } | { ok: false; error: AdminActionError };

/**
 * Unfreeze (design 25): clears the freeze and writes ADMIN_UNFREEZE with the admin's id and written reason.
 * Old sessions stay ended; the user simply logs in again.
 */
export async function unfreezeUser(adminId: number, userId: number, reason: string): Promise<AdminActionResult> {
  return inTransaction(async (client) => {
    const user = await lockCustomer(client, userId);
    if (!user) return { ok: false, error: 'not_found' };
    if (user.deactivated) return { ok: false, error: 'deactivated' };
    if (!user.frozen) return { ok: false, error: 'not_frozen' };
    await client.query('UPDATE users SET frozen_at = NULL WHERE id = $1', [userId]);
    await logSecurityEvent({ userId, type: 'ADMIN_UNFREEZE', reason, actorId: adminId }, client);
    return { ok: true };
  });
}

/** An admin freezes a customer: the same freeze as the owner's (holds cancelled, every phone logged out), plus ADMIN_FREEZE. */
export async function freezeUser(adminId: number, userId: number, reason: string): Promise<AdminActionResult> {
  return inTransaction(async (client) => {
    const user = await lockCustomer(client, userId);
    if (!user) return { ok: false, error: 'not_found' };
    if (user.deactivated) return { ok: false, error: 'deactivated' };
    if (user.frozen) return { ok: false, error: 'already_frozen' };
    await freezeAccount(client, userId, `Frozen by an admin. ${reason}`, { source: 'admin' });
    await logSecurityEvent({ userId, type: 'ADMIN_FREEZE', reason, actorId: adminId }, client);
    return { ok: true };
  });
}

/** An admin trusts one of a customer's phones (e.g. after checking it's really theirs), logged as ADMIN_TRUST_DEVICE. */
export async function trustUserDevice(adminId: number, userId: number, deviceId: string, reason: string): Promise<AdminActionResult> {
  return inTransaction(async (client) => {
    const user = await lockCustomer(client, userId);
    if (!user) return { ok: false, error: 'not_found' };
    if (user.deactivated) return { ok: false, error: 'deactivated' };
    const { rows } = await client.query<{ name: string; trusted: boolean }>(
      'SELECT name, trusted FROM known_devices WHERE user_id = $1 AND device_id::text = $2 FOR UPDATE',
      [userId, deviceId],
    );
    if (!rows[0]) return { ok: false, error: 'not_found' };
    if (rows[0].trusted) return { ok: false, error: 'already_trusted' };
    await client.query('UPDATE known_devices SET trusted = true WHERE user_id = $1 AND device_id::text = $2', [userId, deviceId]);
    await logSecurityEvent({ userId, type: 'ADMIN_TRUST_DEVICE', reason: `${rows[0].name}: ${reason}`, actorId: adminId }, client);
    return { ok: true };
  });
}

/** Locks the customer's row for this change (two admins can't act on the same user at once). Null if not a customer. */
export async function lockCustomer(client: PoolClient, userId: number): Promise<{ frozen: boolean; deactivated: boolean } | null> {
  const { rows } = await client.query<{ frozen: boolean; deactivated: boolean }>(
    "SELECT frozen_at IS NOT NULL AS frozen, deactivated_at IS NOT NULL AS deactivated FROM users WHERE id = $1 AND role = 'customer' FOR UPDATE",
    [userId],
  );
  return rows[0] ?? null;
}

/** Runs the work in one database transaction: saved only if it returns { ok: true }. */
export async function inTransaction<Result extends { ok: boolean }>(work: (client: PoolClient) => Promise<Result>): Promise<Result> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query(result.ok ? 'COMMIT' : 'ROLLBACK');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
