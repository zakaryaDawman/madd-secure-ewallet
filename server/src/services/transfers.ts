import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { maskName } from '../utils/mask';
import type { TransferInput } from '../validation/transfer';
import { checkPin, PinCheck } from './pinCheck';
import { runTransferRules } from './transferRules';
import { holdTransfer } from './holds';
import { notify } from './notify';
import { alertTrustedPhones } from './push';
import { heldTransferAlert } from './pushAlerts';

export type TransferReceipt = {
  id: number;
  reference: string;
  amountSen: number;
  note: string | null;
  recipientName: string; // masked
  newBalanceSen: number;
  createdAt: string;
};

export type TransferError = 'recipient_not_found' | 'self' | 'insufficient_funds';
export type TransferResult =
  | { ok: true; status: 'sent'; receipt: TransferReceipt }
  | { ok: true; status: 'held'; id: number }
  | { ok: false; error: TransferError }
  | Exclude<PinCheck, { ok: true }>;

/**
 * Sends money from one user to another.
 * Order: check PIN (with the wrong-PIN lock), find recipient, then inside ONE database transaction: check the balance,
 * run rules R1, R2 + R3, and either hold the transfer (a rule fired, no money moves) or move the money.
 */
export async function sendMoney(
  sender: { userId: number; deviceId: string },
  input: TransferInput,
  recipientPhone: string,
): Promise<TransferResult> {
  const senderId = sender.userId;
  const pin = await checkPin(senderId, input.pin);
  if (!pin.ok) return pin;

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
    const fired = await runTransferRules(client, sender, input.amountSen);
    if (fired.length > 0) {
      const id = await holdTransfer(client, sender, recipient.id, input, fired);
      await client.query('COMMIT');
      alertTrustedPhones(senderId, heldTransferAlert(input.amountSen)); // only after COMMIT: never alert about a hold that wasn't saved
      return { ok: true, status: 'held', id };
    }
    const receipt = await moveMoney(client, senderId, recipient, input);
    await client.query('COMMIT');
    return { ok: true, status: 'sent', receipt };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
export async function lockWallets(client: PoolClient, senderId: number, recipientId: number): Promise<number> {
  const { rows } = await client.query<{ user_id: number; balance_sen: string }>(
    'SELECT user_id, balance_sen FROM wallets WHERE user_id = ANY($1) ORDER BY user_id FOR UPDATE',
    [[senderId, recipientId]],
  );
  return Number(rows.find((r) => r.user_id === senderId)?.balance_sen ?? 0);
}

/** Records a normal (not held) transfer, moves the money and tells both people. Must run inside lockWallets' transaction. */
async function moveMoney(
  client: PoolClient,
  senderId: number,
  recipient: { id: number; fullName: string },
  input: TransferInput,
): Promise<TransferReceipt> {
  const newBalanceSen = await moveBalances(client, senderId, recipient.id, input.amountSen);
  const note = input.note || null;
  const { rows } = await client.query<{ id: number; created_at: Date }>(
    `INSERT INTO transactions (sender_id, receiver_id, amount_sen, note, status, completed_at)
     VALUES ($1, $2, $3, $4, 'COMPLETED', now()) RETURNING id, created_at`,
    [senderId, recipient.id, input.amountSen, note],
  );
  await notify({ userId: senderId, kind: 'MONEY_SENT', transactionId: rows[0].id }, client);
  await notify({ userId: recipient.id, kind: 'MONEY_RECEIVED', transactionId: rows[0].id }, client);
  return {
    id: rows[0].id,
    reference: makeReference(rows[0].id, rows[0].created_at),
    amountSen: input.amountSen,
    note,
    recipientName: maskName(recipient.fullName),
    newBalanceSen,
    createdAt: rows[0].created_at.toISOString(),
  };
}

/**
 * Takes the amount from the sender and gives it to the recipient. Returns the sender's new balance.
 * Must run inside lockWallets' transaction. Used by normal transfers and by "Yes, it was me".
 */
export async function moveBalances(client: PoolClient, senderId: number, recipientId: number, amountSen: number): Promise<number> {
  const debited = await client.query<{ balance_sen: string }>(
    'UPDATE wallets SET balance_sen = balance_sen - $2, updated_at = now() WHERE user_id = $1 RETURNING balance_sen',
    [senderId, amountSen],
  );
  await client.query('UPDATE wallets SET balance_sen = balance_sen + $2, updated_at = now() WHERE user_id = $1', [recipientId, amountSen]);
  return Number(debited.rows[0].balance_sen);
}

/** Human-readable receipt number, e.g. "MD-20261120-0042". */
export function makeReference(id: number, date: Date): string {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `MD-${day}-${String(id).padStart(4, '0')}`;
}
