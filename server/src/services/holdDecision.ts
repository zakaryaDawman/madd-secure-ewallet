import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { maskName } from '../utils/mask';
import { checkPin, PinCheck } from './pinCheck';
import { lockWallets, makeReference, moveBalances, TransferReceipt } from './transfers';
import { endAllSessions } from './sessions';
import { logSecurityEvent } from './securityLog';

type HeldRow = {
  id: number;
  receiver_id: number;
  receiver_name: string;
  amount_sen: string;
  note: string | null;
  status: string;
  ran_out: boolean;
  created_at: Date;
};

export type DecisionError = 'not_found' | 'already_handled' | 'expired' | 'insufficient_funds';
export type ConfirmResult = { ok: true; receipt: TransferReceipt } | { ok: false; error: DecisionError } | Exclude<PinCheck, { ok: true }>;
export type RejectResult = { ok: true; cancelledAmountSen: number } | { ok: false; error: 'not_found' | 'already_handled' };

/**
 * "Yes, it was me": checks the PIN, then in ONE database transaction locks the held transfer, checks it is still waiting,
 * checks the balance again and moves the money. A second tap waits for the lock, then finds it already COMPLETED.
 */
export async function confirmHold(userId: number, transactionId: number, pin: string): Promise<ConfirmResult> {
  const pinCheck = await checkPin(userId, pin);
  if (!pinCheck.ok) return pinCheck;

  return inTransaction(async (client) => {
    const held = await lockHeldTransfer(client, userId, transactionId);
    if (!held) return { ok: false, error: 'not_found' };
    if (held.status !== 'PENDING') return { ok: false, error: 'already_handled' };
    if (held.ran_out) return { ok: false, error: 'expired' };

    const amountSen = Number(held.amount_sen);
    if ((await lockWallets(client, userId, held.receiver_id)) < amountSen) return { ok: false, error: 'insufficient_funds' };
    const newBalanceSen = await moveBalances(client, userId, held.receiver_id, amountSen);
    await client.query("UPDATE transactions SET status = 'COMPLETED', completed_at = now() WHERE id = $1", [held.id]);
    await logSecurityEvent({ userId, type: 'HOLD_CONFIRMED', transactionId: held.id, reason: 'The owner confirmed the held transfer with their PIN.' }, client);
    return { ok: true, receipt: toReceipt(held, newBalanceSen) };
  });
}

/**
 * "No, freeze my account": in ONE database transaction cancels the user's held transfers, freezes the account
 * and ends every session on every phone. Works even if the 5 minutes just ran out; only a completed transfer is refused.
 */
export async function rejectHold(userId: number, transactionId: number): Promise<RejectResult> {
  return inTransaction(async (client) => {
    const held = await lockHeldTransfer(client, userId, transactionId);
    if (!held) return { ok: false, error: 'not_found' };
    if (held.status === 'COMPLETED') return { ok: false, error: 'already_handled' };

    await client.query("UPDATE transactions SET status = 'CANCELLED' WHERE sender_id = $1 AND status = 'PENDING'", [userId]);
    await client.query('UPDATE users SET frozen_at = now() WHERE id = $1 AND frozen_at IS NULL', [userId]);
    await endAllSessions(client, userId, 'freeze');
    await logSecurityEvent({ userId, type: 'HOLD_REJECTED', transactionId: held.id, reason: 'The owner said the held transfer was not them.' }, client);
    await logSecurityEvent({ userId, type: 'ACCOUNT_FROZEN', reason: 'Account frozen by the owner. Every session was ended.' }, client);
    return { ok: true, cancelledAmountSen: Number(held.amount_sen) };
  });
}

/** Locks the user's own transfer row (FOR UPDATE) so two taps can't decide it at the same time. Null if it isn't theirs. */
async function lockHeldTransfer(client: PoolClient, userId: number, transactionId: number): Promise<HeldRow | null> {
  const { rows } = await client.query<HeldRow>(
    `SELECT t.id, t.receiver_id, u.full_name AS receiver_name, t.amount_sen, t.note, t.status,
            t.expires_at IS NOT NULL AND t.expires_at <= now() AS ran_out, t.created_at
     FROM transactions t JOIN users u ON u.id = t.receiver_id
     WHERE t.id = $1 AND t.sender_id = $2
     FOR UPDATE OF t`,
    [transactionId, userId],
  );
  return rows[0] ?? null;
}

/** The receipt for the Sent screen (design 10), now that the held transfer went through. */
function toReceipt(held: HeldRow, newBalanceSen: number): TransferReceipt {
  return {
    id: held.id,
    reference: makeReference(held.id, held.created_at),
    amountSen: Number(held.amount_sen),
    note: held.note,
    recipientName: maskName(held.receiver_name),
    newBalanceSen,
    createdAt: held.created_at.toISOString(),
  };
}

/** Runs the work in one database transaction: saved only if it returns { ok: true }, otherwise nothing changes. */
async function inTransaction<T extends { ok: boolean }>(work: (client: PoolClient) => Promise<T>): Promise<T> {
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
