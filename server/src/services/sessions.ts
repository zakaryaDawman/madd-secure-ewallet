import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { TOKEN_LIFETIME_MINUTES } from '../auth/tokens';

export type SessionState = 'active' | 'expired' | 'revoked' | 'frozen';

/** Starts a new 30-minute session for the user and returns its id (goes inside the JWT). */
export async function createSession(userId: number): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO sessions (user_id, expires_at) VALUES ($1, now() + make_interval(mins => $2)) RETURNING id`,
    [userId, TOKEN_LIFETIME_MINUTES],
  );
  return rows[0].id;
}

/** Looks up a session for this user: active, expired, frozen (ended by a freeze), or revoked (logged out, or not found). */
export async function sessionState(sessionId: string, userId: number): Promise<SessionState> {
  const { rows } = await pool.query<{ revoked: boolean; frozen: boolean; expired: boolean }>(
    `SELECT revoked_at IS NOT NULL AS revoked, revoke_reason = 'freeze' AS frozen, expires_at <= now() AS expired
     FROM sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId],
  );
  if (rows.length > 0 && rows[0].frozen) return 'frozen';
  if (rows.length === 0 || rows[0].revoked) return 'revoked';
  return rows[0].expired ? 'expired' : 'active';
}

/** Cancels one session (logout). Other sessions of the same user keep working. */
export async function revokeSession(sessionId: string, reason: 'logout'): Promise<void> {
  await pool.query('UPDATE sessions SET revoked_at = now(), revoke_reason = $2 WHERE id = $1 AND revoked_at IS NULL', [sessionId, reason]);
}

/** Ends every open session of the user (all phones) at once. Runs inside the caller's database transaction. */
export async function endAllSessions(client: PoolClient, userId: number, reason: 'freeze'): Promise<void> {
  await client.query('UPDATE sessions SET revoked_at = now(), revoke_reason = $2 WHERE user_id = $1 AND revoked_at IS NULL', [userId, reason]);
}
