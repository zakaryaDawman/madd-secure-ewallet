import { pool } from '../db/pool';
import { maskName, maskPhone } from '../utils/mask';
import { makeReference } from './transfers';
import { expireHolds, holdDetails, HoldDetails } from './holds';
import { isTrustedDevice } from './devices';

export const FILTERS = ['all', 'in', 'out', 'held'] as const;
export type TransactionFilter = (typeof FILTERS)[number];

export type TransactionItem = {
  id: number;
  direction: 'in' | 'out';
  amountSen: number;
  otherName: string;
  note: string | null;
  status: string;
  createdAt: string;
};

export type TransactionDetail = TransactionItem & {
  otherNameMasked: string; // e.g. "Ahm*** Ali", for the Held and Cancelled screens
  otherPhone: string;
  reference: string;
  completedAt: string | null;
  sentFrom: { name: string; thisDevice: boolean } | null; // the phone a sent transfer came from (design 26)
  hold: HoldDetails | null; // only for my own transfer while it waits for me (PENDING)
};

type TransactionRow = {
  id: number;
  direction: 'in' | 'out';
  amount_sen: string;
  other_name: string;
  other_phone: string;
  note: string | null;
  status: string;
  created_at: Date;
  completed_at: Date | null;
};

/**
 * Rows the user is allowed to see: everything they sent, and money they received once it has arrived.
 * $1 is always the logged-in user, so nobody can see someone else's transactions.
 */
const VISIBLE_TO_USER = `
  SELECT t.id,
         CASE WHEN t.sender_id = $1 THEN 'out' ELSE 'in' END AS direction,
         t.amount_sen, other.full_name AS other_name, other.phone AS other_phone,
         t.note, t.status, t.created_at, t.completed_at
  FROM transactions t
  JOIN users other ON other.id = CASE WHEN t.sender_id = $1 THEN t.receiver_id ELSE t.sender_id END
  WHERE (t.sender_id = $1 OR (t.receiver_id = $1 AND t.status = 'COMPLETED'))`;

/** Extra SQL condition for each History filter chip. */
const FILTER_SQL: Record<TransactionFilter, string> = {
  all: '',
  in: 'AND t.receiver_id = $1',
  out: 'AND t.sender_id = $1',
  held: "AND t.status = 'PENDING'",
};

/** The user's transactions, newest first, narrowed by a filter (All / In / Out / Held). Ran-out holds are cancelled first. */
export async function listTransactions(userId: number, filter: TransactionFilter, limit = 200): Promise<TransactionItem[]> {
  await expireHolds(userId);
  const { rows } = await pool.query<TransactionRow>(
    `${VISIBLE_TO_USER} ${FILTER_SQL[filter]} ORDER BY t.created_at DESC, t.id DESC LIMIT $2`,
    [userId, limit],
  );
  return rows.map(toItem);
}

/**
 * One transaction with its details, or null if it doesn't exist or isn't the user's. A ran-out hold is cancelled first;
 * a hold still waiting comes with its reasons and time left. `deviceId` (from the token) marks "This phone".
 */
export async function getTransaction(userId: number, id: number, deviceId: string): Promise<TransactionDetail | null> {
  await expireHolds(userId);
  const { rows } = await pool.query<TransactionRow>(`${VISIBLE_TO_USER} AND t.id = $2`, [userId, id]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...toItem(row),
    otherNameMasked: maskName(row.other_name),
    otherPhone: maskPhone(row.other_phone),
    reference: makeReference(row.id, row.created_at),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    sentFrom: row.direction === 'out' ? await sentFrom(userId, id, deviceId) : null,
    hold: row.status === 'PENDING' && row.direction === 'out' ? await holdDetails(row.id, deviceId, await isTrustedDevice(userId, deviceId)) : null,
  };
}

/** The name of the phone this transfer was sent from, and whether it is the phone asking. Null for older transfers. */
async function sentFrom(userId: number, id: number, deviceId: string): Promise<TransactionDetail['sentFrom']> {
  const { rows } = await pool.query<{ name: string; device_id: string }>(
    `SELECT d.name, d.device_id FROM transactions t JOIN known_devices d ON d.user_id = $1 AND d.device_id = t.device_id
     WHERE t.id = $2 AND t.sender_id = $1`,
    [userId, id],
  );
  return rows[0] ? { name: rows[0].name, thisDevice: rows[0].device_id === deviceId } : null;
}

/** Turns a database row into the shape the app receives (sen as a number, dates as ISO text). */
function toItem(row: TransactionRow): TransactionItem {
  return {
    id: row.id,
    direction: row.direction,
    amountSen: Number(row.amount_sen),
    otherName: row.other_name,
    note: row.note,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}
