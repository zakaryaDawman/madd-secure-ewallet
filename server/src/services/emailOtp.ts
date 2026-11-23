import { randomInt } from 'node:crypto';
import bcrypt from 'bcrypt';
import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { ruleConfig } from '../rules/config';
import { otpState, resendState, type OtpRecord, type ResendState } from '../rules/otpCheck';
import { formatRM } from '../utils/money';
import { BCRYPT_ROUNDS } from './users';
import { logSecurityEvent } from './securityLog';
import { sendMail } from './mailer';
import { brandedEmail } from './mailTemplate';

export type CodeCheck =
  | { ok: true }
  | { ok: false; error: 'wrong_code'; triesLeft: number }
  | { ok: false; error: 'code_locked' | 'code_expired' | 'not_found' };
export type ResendResult =
  | { ok: true }
  | { ok: false; error: 'not_found' | 'resend_limit' }
  | { ok: false; error: 'resend_cooldown'; secondsLeft: number };

type OtpRow = { id: number; code_hash: string; expires_at: Date; used_at: Date | null; attempts: number; sends: number; last_sent_at: Date };

const inFlight = new Set<Promise<void>>();

/** A random 6-digit code from the system's secure random source, e.g. "048213". */
function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Makes the code for a held transfer and saves only its hash. Runs inside the hold's database transaction.
 * Returns the plain code so it can be emailed AFTER the commit (never an email about a hold that wasn't saved).
 */
export async function createHoldCode(client: PoolClient, userId: number, transactionId: number): Promise<string> {
  const code = newCode();
  await client.query(
    `INSERT INTO email_otps (user_id, purpose, transaction_id, code_hash, expires_at)
     VALUES ($1, 'HOLD', $2, $3, now() + make_interval(mins => $4))`,
    [userId, transactionId, await bcrypt.hash(code, BCRYPT_ROUNDS), ruleConfig.otpMinutes],
  );
  return code;
}

/** Emails the code in the background (the transfer never waits for Gmail), then logs OTP_SENT if Gmail accepted it. */
export function emailHoldCode(userId: number, transactionId: number, amountSen: number, code: string): void {
  const job = sendHoldEmail(userId, transactionId, amountSen, code).catch((err) => console.error('Code email failed:', err?.code ?? 'error'));
  inFlight.add(job);
  void job.finally(() => inFlight.delete(job));
}

/** Waits until every background code email has finished (used by the tests). */
export async function codeEmailsSettled(): Promise<void> {
  await Promise.all([...inFlight]);
}

/** Looks up the owner's email, sends the MADD code email and logs it. The code itself is never logged. */
async function sendHoldEmail(userId: number, transactionId: number, amountSen: number, code: string): Promise<void> {
  const { rows } = await pool.query<{ email: string }>('SELECT email FROM users WHERE id = $1', [userId]);
  const title = 'Your MADD transfer code';
  const lines = [
    `Your code is ${code}`,
    `We paused your transfer of ${formatRM(amountSen)}. Enter this code and your PIN in MADD to send it. The code works for ${ruleConfig.otpMinutes} minutes.`,
    "If this wasn't you, open MADD and tap \"No, freeze my account\". Never share this code with anyone.",
  ];
  if (await sendMail(rows[0].email, title, lines.join('\n\n'), brandedEmail(title, lines))) {
    await logSecurityEvent({ userId, type: 'OTP_SENT', transactionId, reason: 'A one-time code was emailed to the owner.' });
  }
}

/**
 * Checks the code for a held transfer in its own small transaction, so a wrong try is counted even when nothing else
 * happens. Locks the code row so two tries can't both use the last attempt. Does NOT use the code up (see useHoldCode).
 * Someone else's transfer (or one held before codes existed) is simply not found.
 */
export async function checkHoldCode(userId: number, transactionId: number, code: string): Promise<CodeCheck> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await lockCode(client, userId, transactionId);
    const result = row ? await compare(client, userId, transactionId, row, code) : ({ ok: false, error: 'not_found' } as const);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Compares the typed code with the hash; a wrong one adds an attempt, and the 5th wrong one is logged as OTP_LOCKED. */
async function compare(client: PoolClient, userId: number, transactionId: number, row: OtpRow, code: string): Promise<CodeCheck> {
  const state = otpState(toRecord(row), new Date());
  if (!state.usable) return { ok: false, error: state.reason === 'locked' ? 'code_locked' : 'code_expired' };
  if (await bcrypt.compare(code, row.code_hash)) return { ok: true };

  await client.query('UPDATE email_otps SET attempts = attempts + 1 WHERE id = $1', [row.id]);
  const triesLeft = state.triesLeft - 1;
  if (triesLeft > 0) return { ok: false, error: 'wrong_code', triesLeft };
  await logSecurityEvent({ userId, type: 'OTP_LOCKED', transactionId, reason: 'Too many wrong codes. The transfer can only be cancelled now.' }, client);
  return { ok: false, error: 'code_locked' };
}

/** Marks the code used, inside the transaction that sends the money. False if it was already used (a second tap). */
export async function useHoldCode(client: PoolClient, transactionId: number): Promise<boolean> {
  const { rowCount } = await client.query('UPDATE email_otps SET used_at = now() WHERE transaction_id = $1 AND used_at IS NULL', [transactionId]);
  return rowCount === 1;
}

/** "Resend code": a new code replaces the old one (same tries count), at most 3 emails and one per 60 seconds. */
export async function resendHoldCode(userId: number, transactionId: number): Promise<ResendResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await lockCode(client, userId, transactionId, true);
    const allowed: ResendState | null = row ? resendState(toRecord(row), new Date()) : null;
    if (!row || !allowed || !allowed.allowed) {
      await client.query('ROLLBACK');
      if (!allowed || allowed.allowed) return { ok: false, error: 'not_found' };
      return allowed.reason === 'cooldown' ? { ok: false, error: 'resend_cooldown', secondsLeft: allowed.secondsLeft } : { ok: false, error: 'resend_limit' };
    }
    const code = newCode();
    await client.query(
      `UPDATE email_otps SET code_hash = $2, sends = sends + 1, last_sent_at = now(), expires_at = now() + make_interval(mins => $3) WHERE id = $1`,
      [row.id, await bcrypt.hash(code, BCRYPT_ROUNDS), ruleConfig.otpMinutes],
    );
    const { rows } = await client.query<{ amount_sen: string }>('SELECT amount_sen FROM transactions WHERE id = $1', [transactionId]);
    await client.query('COMMIT');
    emailHoldCode(userId, transactionId, Number(rows[0].amount_sen), code);
    return { ok: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Locks the code of the user's own held transfer. With `stillPending`, only while the transfer is waiting and not timed out. */
async function lockCode(client: PoolClient, userId: number, transactionId: number, stillPending = false): Promise<OtpRow | null> {
  const { rows } = await client.query<OtpRow>(
    `SELECT o.id, o.code_hash, o.expires_at, o.used_at, o.attempts, o.sends, o.last_sent_at
     FROM email_otps o JOIN transactions t ON t.id = o.transaction_id
     WHERE o.transaction_id = $1 AND o.user_id = $2 AND o.purpose = 'HOLD'
       AND ($3 = false OR (t.status = 'PENDING' AND t.expires_at > now()))
     FOR UPDATE OF o`,
    [transactionId, userId, stillPending],
  );
  return rows[0] ?? null;
}

/** The row as the pure rule sees it. */
function toRecord(row: OtpRow): OtpRecord {
  return { expiresAt: row.expires_at, usedAt: row.used_at, attempts: row.attempts, sends: row.sends, lastSentAt: row.last_sent_at };
}
