import bcrypt from 'bcrypt';
import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { ruleConfig } from '../rules/config';
import { otpState, resendState, type OtpRecord } from '../rules/otpCheck';
import { maskEmail, maskPhone } from '../utils/mask';
import { checkPin, type PinCheck } from './pinCheck';
import { inBackground, newCode, type CodeCheck, type ResendResult } from './emailOtp';
import { BCRYPT_ROUNDS, isUniqueViolation } from './users';
import { logSecurityEvent } from './securityLog';
import { sendMail } from './mailer';
import { brandedEmail } from './mailTemplate';

export type StartResult =
  | { ok: true; sentTo: string }
  | { ok: false; error: 'same_phone' }
  | { ok: false; error: 'phone_taken' }
  | { ok: false; error: 'resend_cooldown'; secondsLeft: number }
  | Exclude<PinCheck, { ok: true }>;
export type ConfirmResult = CodeCheck | { ok: false; error: 'phone_taken' };

type PhoneRow = { id: number; code_hash: string; new_phone: string; expires_at: Date; used_at: Date | null; attempts: number; sends: number; last_sent_at: Date };

/**
 * Step 1 of changing my phone number (task G11): checks my PIN (wrong tries count towards the PIN lock) and that the new
 * number is free, then emails a 6-digit code to me. Nothing changes until the code is entered. Returns where it went (masked).
 * Starting again within 60 seconds of the last code is refused, so a new start can't be used to skip the resend limits.
 */
export async function startPhoneChange(userId: number, pin: string, newPhone: string): Promise<StartResult> {
  const pinCheck = await checkPin(userId, pin);
  if (!pinCheck.ok) return pinCheck;
  const { rows } = await pool.query<{ email: string; phone: string; taken: boolean }>(
    'SELECT email, phone, EXISTS (SELECT 1 FROM users o WHERE o.phone = $2 AND o.id <> u.id) AS taken FROM users u WHERE id = $1',
    [userId, newPhone],
  );
  const me = rows[0];
  if (me.phone === newPhone) return { ok: false, error: 'same_phone' };
  if (me.taken) return { ok: false, error: 'phone_taken' };
  const waitSeconds = await secondsUntilNextCode(userId);
  if (waitSeconds > 0) return { ok: false, error: 'resend_cooldown', secondsLeft: waitSeconds };

  const code = newCode();
  await pool.query('DELETE FROM email_otps WHERE user_id = $1 AND purpose = $2', [userId, 'PHONE']);
  await pool.query(
    `INSERT INTO email_otps (user_id, purpose, new_phone, code_hash, expires_at) VALUES ($1, 'PHONE', $2, $3, now() + make_interval(mins => $4))`,
    [userId, newPhone, await bcrypt.hash(code, BCRYPT_ROUNDS), ruleConfig.otpMinutes],
  );
  emailPhoneCode(me.email, newPhone, code);
  return { ok: true, sentTo: maskEmail(me.email) };
}

/**
 * Step 2: checks the emailed code (5 wrong tries lock it, 5 minutes). The right code saves the new number, logs
 * PHONE_CHANGED and emails me that it changed. The row is locked so two tries can't both use the last attempt.
 */
export async function confirmPhoneChange(userId: number, code: string): Promise<ConfirmResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await lockPhoneCode(client, userId);
    const result = row ? await compare(client, userId, row, code) : ({ ok: false, error: 'not_found' } as const);
    await client.query('COMMIT');
    if (result.ok && row) emailPhoneChanged(userId, row.new_phone);
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    if (isUniqueViolation(err)) return { ok: false, error: 'phone_taken' }; // someone took the number in the meantime
    throw err;
  } finally {
    client.release();
  }
}

/** "Resend code": a new code for the same new number, at most 3 emails and one per 60 seconds (same rules as task G4). */
export async function resendPhoneCode(userId: number): Promise<ResendResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await lockPhoneCode(client, userId);
    const allowed = row ? resendState(toRecord(row), new Date()) : null;
    if (!row || !allowed || !allowed.allowed) {
      await client.query('ROLLBACK');
      if (!allowed || allowed.allowed) return { ok: false, error: 'not_found' };
      return allowed.reason === 'cooldown' ? { ok: false, error: 'resend_cooldown', secondsLeft: allowed.secondsLeft } : { ok: false, error: 'resend_limit' };
    }
    const code = newCode();
    await client.query(
      'UPDATE email_otps SET code_hash = $2, sends = sends + 1, last_sent_at = now(), expires_at = now() + make_interval(mins => $3) WHERE id = $1',
      [row.id, await bcrypt.hash(code, BCRYPT_ROUNDS), ruleConfig.otpMinutes],
    );
    const { rows } = await client.query<{ email: string }>('SELECT email FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    emailPhoneCode(rows[0].email, row.new_phone, code);
    return { ok: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Right code: saves the number and uses the code up. Wrong: counts the try (the 5th locks it). */
async function compare(client: PoolClient, userId: number, row: PhoneRow, code: string): Promise<CodeCheck> {
  const state = otpState(toRecord(row), new Date());
  if (!state.usable) return { ok: false, error: state.reason === 'locked' ? 'code_locked' : 'code_expired' };
  if (!(await bcrypt.compare(code, row.code_hash))) {
    await client.query('UPDATE email_otps SET attempts = attempts + 1 WHERE id = $1', [row.id]);
    const triesLeft = state.triesLeft - 1;
    return triesLeft > 0 ? { ok: false, error: 'wrong_code', triesLeft } : { ok: false, error: 'code_locked' };
  }
  const { rows } = await client.query<{ phone: string }>('SELECT phone FROM users WHERE id = $1', [userId]);
  await client.query('UPDATE users SET phone = $2 WHERE id = $1', [userId, row.new_phone]);
  await client.query('UPDATE email_otps SET used_at = now() WHERE id = $1', [row.id]);
  await logSecurityEvent(
    { userId, type: 'PHONE_CHANGED', reason: 'The owner changed their phone number with their PIN and an emailed code.', details: { from: maskPhone(rows[0].phone), to: maskPhone(row.new_phone) } },
    client,
  );
  return { ok: true };
}

/** Seconds until another phone-change code may be emailed (0 = now). */
async function secondsUntilNextCode(userId: number): Promise<number> {
  const { rows } = await pool.query<{ last_sent_at: Date }>("SELECT last_sent_at FROM email_otps WHERE user_id = $1 AND purpose = 'PHONE'", [userId]);
  if (!rows[0]) return 0;
  const waitMs = rows[0].last_sent_at.getTime() + ruleConfig.otpResendSeconds * 1000 - Date.now();
  return Math.max(0, Math.ceil(waitMs / 1000));
}

/** Locks my open (not used) phone change, or null if there is none. */
async function lockPhoneCode(client: PoolClient, userId: number): Promise<PhoneRow | null> {
  const { rows } = await client.query<PhoneRow>(
    `SELECT id, code_hash, new_phone, expires_at, used_at, attempts, sends, last_sent_at FROM email_otps
     WHERE user_id = $1 AND purpose = 'PHONE' AND used_at IS NULL FOR UPDATE`,
    [userId],
  );
  return rows[0] ?? null;
}

/** Emails the code to the owner, naming the new number (masked) so they know what they are approving. */
function emailPhoneCode(email: string, newPhone: string, code: string): void {
  const title = 'Your MADD phone change code';
  const lines = [
    `Your code is ${code}`,
    `Enter it in MADD to change your phone number to ${maskPhone(newPhone)}. It works for ${ruleConfig.otpMinutes} minutes.`,
    "If this wasn't you, don't share this code, and change your password. Never share this code with anyone.",
  ];
  inBackground(sendMail(email, title, lines.join('\n\n'), brandedEmail(title, lines.slice(1), code)).then(() => undefined));
}

/** Tells the owner by email that their number changed (people now pay them on the new one). */
function emailPhoneChanged(userId: number, newPhone: string): void {
  inBackground(
    (async () => {
      const { rows } = await pool.query<{ email: string }>('SELECT email FROM users WHERE id = $1', [userId]);
      const title = 'Your MADD phone number changed';
      const lines = [`Your phone number is now ${maskPhone(newPhone)}.`, "If this wasn't you, open MADD and freeze your account, then contact support."];
      await sendMail(rows[0].email, title, lines.join('\n\n'), brandedEmail(title, lines));
    })(),
  );
}

/** The row as the pure rule sees it. */
function toRecord(row: PhoneRow): OtpRecord {
  return { expiresAt: row.expires_at, usedAt: row.used_at, attempts: row.attempts, sends: row.sends, lastSentAt: row.last_sent_at };
}
