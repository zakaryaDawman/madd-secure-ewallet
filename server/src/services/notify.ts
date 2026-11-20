import type { PoolClient } from 'pg';
import { pool } from '../db/pool';

export type NotificationKind =
  | 'MONEY_RECEIVED'
  | 'MONEY_SENT'
  | 'TRANSFER_HELD'
  | 'HOLD_CONFIRMED'
  | 'NEW_DEVICE'
  | 'LOGIN_LOCKED'
  | 'PIN_LOCKED'
  | 'WELCOME';

/**
 * Adds one item to a user's Inbox. Pass the database client of the change it describes (a transfer, a login)
 * so both are saved together, or nothing is.
 */
export async function notify(
  item: { userId: number; kind: NotificationKind; transactionId?: number; deviceId?: string },
  db: PoolClient | typeof pool = pool,
): Promise<void> {
  await db.query('INSERT INTO notifications (user_id, kind, transaction_id, device_id) VALUES ($1, $2, $3, $4)', [
    item.userId,
    item.kind,
    item.transactionId ?? null,
    item.deviceId ?? null,
  ]);
}
