import type { PoolClient } from 'pg';
import { pool } from '../db/pool';

export type SecurityEventType = 'RULE_FIRED' | 'HOLD_EXPIRED' | 'HOLD_CONFIRMED' | 'HOLD_REJECTED' | 'ACCOUNT_FROZEN' | 'PIN_LOCKED' | 'DEVICE_TRUSTED';

export type SecurityEvent = {
  userId: number;
  type: SecurityEventType;
  reason: string;
  rule?: 'R1' | 'R2' | 'R3' | 'R4';
  transactionId?: number;
  details?: object; // the numbers a rule used (task E2)
};

/**
 * Adds one row to the security log (FR-16). Rows can never be changed or removed (database trigger).
 * Pass the transfer's database client to save it in the same transaction as the change it describes.
 */
export async function logSecurityEvent(event: SecurityEvent, db: PoolClient | typeof pool = pool): Promise<void> {
  await db.query('INSERT INTO security_events (user_id, type, rule, transaction_id, reason, details) VALUES ($1, $2, $3, $4, $5, $6)', [
    event.userId,
    event.type,
    event.rule ?? null,
    event.transactionId ?? null,
    event.reason,
    event.details ?? null,
  ]);
}
