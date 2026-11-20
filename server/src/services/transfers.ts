import bcrypt from 'bcrypt';
import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { maskName } from '../utils/mask';
import type { TransferInput } from '../validation/transfer';

export type TransferReceipt = {
  id: number;
  reference: string;
  amountSen: number;
  note: string | null;
  recipientName: string; // masked
  newBalanceSen: number;
  createdAt: string;
};

export type TransferError = 'wrong_pin' | 'recipient_not_found' | 'self' | 'insufficient_funds';
export type TransferResult = { ok: true; receipt: TransferReceipt } | { ok: false; error: TransferError };

/**
 * Sends money from one user to another.
 * Order: check PIN, find recipient, then move the money inside ONE database transaction
 * so it is either fully done or not done at all.
 */
export async function sendMoney(senderId: number, input: TransferInput, recipientPhone: string): Promise<TransferResult> {
  if (!(await pinMatches(senderId, input.pin))) return { ok: false, error: 'wrong_pin' };

  const recipient = await findUserByPhone(recipientPhone);
  if (!recipient) return { ok: false, error: 'recipient_not_found' };
  if (recipient.id === senderId) return { ok: false, error: 'self' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const senderBalance = await lockWallets(client, senderId, recipient.id);
    if (senderBalance < input.amountSen) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'insufficient_funds' };
    }
    const receipt = await moveMoney(client, senderId, recipient, input);
    await client.query('COMMIT');
    return { ok: true, receipt };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** True if the PIN matches the one saved (as a bcrypt hash) for this user. */
async function pinMatches(userId: number, pin: string): Promise<boolean> {
  const { rows } = await pool.query<{ pin_hash: string }>('SELECT pin_hash FROM users WHERE id = $1', [userId]);
  return rows.length > 0 && bcrypt.compare(pin, rows[0].pin_hash);
}

/** Finds a user by their +60 phone number. */
async function findUserByPhone(phone: string): Promise<{ id: number; fullName: string } | null> {
  const { rows } = await pool.query<{ id: number; full_name: string }>('SELECT id, full_name FROM users WHERE phone = $1', [phone]);
  return rows[0] ? { id: rows[0].id, fullName: rows[0].full_name } : null;
}

/**
 * Locks both wallets until the transaction ends, so no other transfer can change them meanwhile.
 * Always locks the lower user id first: two people paying each other at once can't block each other forever.
 * Returns the sender's balance.
 */
async function lockWallets(client: PoolClient, senderId: number, recipientId: number): Promise<number> {
  const { rows } = await client.query<{ user_id: number; balance_sen: string }>(
    'SELECT user_id, balance_sen FROM wallets WHERE user_id = ANY($1) ORDER BY user_id FOR UPDATE',
    [[senderId, recipientId]],
  );
  return Number(rows.find((r) => r.user_id === senderId)?.balance_sen ?? 0);
}

/** Takes the money from the sender, gives it to the recipient, and records the transfer. Must run inside lockWallets' transaction. */
async function moveMoney(
  client: PoolClient,
  senderId: number,
  recipient: { id: number; fullName: string },
  input: TransferInput,
): Promise<TransferReceipt> {
  const debited = await client.query<{ balance_sen: string }>(
    'UPDATE wallets SET balance_sen = balance_sen - $2, updated_at = now() WHERE user_id = $1 RETURNING balance_sen',
    [senderId, input.amountSen],
  );
  await client.query('UPDATE wallets SET balance_sen = balance_sen + $2, updated_at = now() WHERE user_id = $1', [recipient.id, input.amountSen]);
  const note = input.note || null;
  const { rows } = await client.query<{ id: number; created_at: Date }>(
    `INSERT INTO transactions (sender_id, receiver_id, amount_sen, note, status, completed_at)
     VALUES ($1, $2, $3, $4, 'COMPLETED', now()) RETURNING id, created_at`,
    [senderId, recipient.id, input.amountSen, note],
  );
  return {
    id: rows[0].id,
    reference: makeReference(rows[0].id, rows[0].created_at),
    amountSen: input.amountSen,
    note,
    recipientName: maskName(recipient.fullName),
    newBalanceSen: Number(debited.rows[0].balance_sen),
    createdAt: rows[0].created_at.toISOString(),
  };
}

/** Human-readable receipt number, e.g. "MD-20261120-0042". */
export function makeReference(id: number, date: Date): string {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `MD-${day}-${String(id).padStart(4, '0')}`;
}
