import { pool } from '../db/pool';

export type Rule = 'R1' | 'R2' | 'R3' | 'R4';

/** One rule that fired, with what the admin needs: who, the transfer (if any), the device, and the saved numbers. */
export type FlaggedRow = {
  eventId: number;
  rule: Rule;
  reason: string;
  details: Record<string, number | string | null> | null; // null for alerts saved before task E2
  flaggedAt: Date;
  userId: number;
  userName: string;
  userEmail: string; // used only to work out the R4 lock; never sent to the console
  userFrozen: boolean;
  transactionId: number | null;
  amountSen: number | null;
  transferStatus: string | null;
  transferCreatedAt: Date | null;
  expiresAt: Date | null;
  recipientName: string | null;
  deviceName: string | null;
  deviceTrusted: boolean | null;
};

type DbRow = {
  id: number; rule: Rule; reason: string; details: FlaggedRow['details']; created_at: Date;
  user_id: number; full_name: string; email: string; frozen: boolean;
  tx_id: number | null; amount_sen: string | null; status: string | null; tx_created_at: Date | null; expires_at: Date | null;
  recipient_name: string | null; device_name: string | null; device_trusted: boolean | null;
};

const SELECT_FLAGGED = `
  SELECT e.id, e.rule, e.reason, e.details, e.created_at,
         u.id AS user_id, u.full_name, u.email, u.frozen_at IS NOT NULL AS frozen,
         t.id AS tx_id, t.amount_sen, t.status, t.created_at AS tx_created_at, t.expires_at,
         r.full_name AS recipient_name, d.name AS device_name, d.trusted AS device_trusted
  FROM security_events e
  JOIN users u ON u.id = e.user_id
  LEFT JOIN transactions t ON t.id = e.transaction_id
  LEFT JOIN users r ON r.id = t.receiver_id
  LEFT JOIN known_devices d ON d.user_id = e.user_id
       AND d.device_id::text = COALESCE(t.device_id::text, e.details->>'deviceId')
  WHERE e.type = 'RULE_FIRED'`;

/** Every rule that fired (optionally only one rule), newest first. */
export async function flaggedRows(rule: Rule | null, limit = 300): Promise<FlaggedRow[]> {
  const { rows } = await pool.query<DbRow>(
    `${SELECT_FLAGGED} AND ($1::text IS NULL OR e.rule = $1) ORDER BY e.created_at DESC, e.id DESC LIMIT $2`,
    [rule, limit],
  );
  return rows.map(toFlaggedRow);
}

/** One rule that fired, by its security-log id, or null. */
export async function flaggedRow(eventId: number): Promise<FlaggedRow | null> {
  const { rows } = await pool.query<DbRow>(`${SELECT_FLAGGED} AND e.id = $1`, [eventId]);
  return rows[0] ? toFlaggedRow(rows[0]) : null;
}

/** Database names to the names the code uses (sen as a number). */
function toFlaggedRow(r: DbRow): FlaggedRow {
  return {
    eventId: r.id, rule: r.rule, reason: r.reason, details: r.details, flaggedAt: r.created_at,
    userId: r.user_id, userName: r.full_name, userEmail: r.email, userFrozen: r.frozen,
    transactionId: r.tx_id, amountSen: r.amount_sen === null ? null : Number(r.amount_sen), transferStatus: r.status,
    transferCreatedAt: r.tx_created_at, expiresAt: r.expires_at,
    recipientName: r.recipient_name, deviceName: r.device_name, deviceTrusted: r.device_trusted,
  };
}
