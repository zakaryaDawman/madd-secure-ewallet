import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { ruleConfig } from '../rules/config';
import type { TransferInput } from '../validation/transfer';
import type { FiredRule } from './transferRules';
import { logSecurityEvent } from './securityLog';

/** What an untrusted phone sees instead of the rule details, so a thief learns nothing about the limits. */
const GENERAL_REASON = 'This transfer needs approval from your usual phone.';

const EXPIRED_REASON = `Not confirmed within ${ruleConfig.holdMinutes} minutes, so it was cancelled. No money moved.`;

/** What the Held screen (design 11) shows about a paused transfer. */
export type HoldDetails = {
  reasons: string[];
  expiresAt: string;
  secondsLeft: number;
  thisDevice: boolean;
  canDecide: boolean; // false on an untrusted phone: it must wait for the usual phone (design 12)
};

/**
 * Saves a transfer as PENDING (no money moves) and writes one security_events row per rule that fired.
 * Must run inside the transfer's database transaction, so the hold and its log rows are saved together. Returns the id.
 */
export async function holdTransfer(
  client: PoolClient,
  sender: { userId: number; deviceId: string },
  recipientId: number,
  input: TransferInput,
  fired: FiredRule[],
): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO transactions (sender_id, receiver_id, amount_sen, note, status, device_id, expires_at)
     VALUES ($1, $2, $3, $4, 'PENDING', $5, now() + make_interval(mins => $6)) RETURNING id`,
    [sender.userId, recipientId, input.amountSen, input.note || null, sender.deviceId, ruleConfig.holdMinutes],
  );
  const id = rows[0].id;
  for (const { rule, reason } of fired) {
    await logSecurityEvent({ userId: sender.userId, type: 'RULE_FIRED', rule, transactionId: id, reason }, client);
  }
  return id;
}

/**
 * Cancels the user's held transfers whose 5 minutes are over (status EXPIRED, no money moved) and logs each one.
 * There is no timer: this runs whenever the user's transactions are read.
 */
export async function expireHolds(userId: number): Promise<void> {
  await pool.query(
    `WITH expired AS (
       UPDATE transactions SET status = 'EXPIRED'
       WHERE sender_id = $1 AND status = 'PENDING' AND expires_at <= now()
       RETURNING id
     )
     INSERT INTO security_events (user_id, type, transaction_id, reason)
     SELECT $1, 'HOLD_EXPIRED', id, $2 FROM expired`,
    [userId, EXPIRED_REASON],
  );
}

/**
 * Why a held transfer was paused, and how long is left. The time left comes from the database clock, not the phone's.
 * An untrusted phone gets one general sentence instead of the rule details, and can't decide.
 */
export async function holdDetails(transactionId: number, deviceId: string, viewerTrusted: boolean): Promise<HoldDetails> {
  const { rows } = await pool.query<{ reasons: string[]; expires_at: Date; seconds_left: number; this_device: boolean }>(
    `SELECT t.expires_at,
            GREATEST(0, CEIL(EXTRACT(EPOCH FROM t.expires_at - now())))::int AS seconds_left,
            t.device_id IS NOT DISTINCT FROM $2::uuid AS this_device,
            ARRAY(SELECT e.reason FROM security_events e
                  WHERE e.transaction_id = t.id AND e.type = 'RULE_FIRED' ORDER BY e.rule) AS reasons
     FROM transactions t WHERE t.id = $1`,
    [transactionId, deviceId],
  );
  const row = rows[0];
  return {
    reasons: viewerTrusted ? row.reasons : [GENERAL_REASON],
    expiresAt: row.expires_at.toISOString(),
    secondsLeft: row.seconds_left,
    thisDevice: row.this_device,
    canDecide: viewerTrusted,
  };
}
