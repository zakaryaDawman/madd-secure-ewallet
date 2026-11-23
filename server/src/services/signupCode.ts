import bcrypt from 'bcrypt';
import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { ruleConfig } from '../rules/config';
import { otpState } from '../rules/otpCheck';
import { BCRYPT_ROUNDS } from './users';
import { inBackground, newCode } from './emailOtp';
import { logSecurityEvent } from './securityLog';
import { sendMail } from './mailer';
import { brandedEmail } from './mailTemplate';

/** A bcrypt hash of a random value, compared when the email has no code, so every "wrong code" takes the same time. */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO5x0Pq4Gx2bEdzyzMOrM4vh1Y7MiG.Wy';

type SignupRow = { user_id: number; otp_id: number; code_hash: string; expires_at: Date; used_at: Date | null; attempts: number; sends: number; last_sent_at: Date };

/** Makes the sign-up code inside the register transaction and saves only its hash. Returns the plain code to email after the commit. */
export async function createSignupCode(client: PoolClient, userId: number): Promise<string> {
  const code = newCode();
  await client.query(
    `INSERT INTO email_otps (user_id, purpose, code_hash, expires_at) VALUES ($1, 'SIGNUP', $2, now() + make_interval(mins => $3))`,
    [userId, await bcrypt.hash(code, BCRYPT_ROUNDS), ruleConfig.otpMinutes],
  );
  return code;
}

/** Emails the sign-up code in the background, so sign-up never waits for Gmail. */
export function emailSignupCode(email: string, code: string): void {
  const title = 'Your MADD sign-up code';
  const lines = [
    `Your code is ${code}`,
    `Enter it in MADD to finish creating your account. It works for ${ruleConfig.otpMinutes} minutes.`,
    "If you didn't sign up for MADD, ignore this email. Never share this code with anyone.",
  ];
  inBackground(sendMail(email, title, lines.join('\n\n'), brandedEmail(title, lines)).then(() => undefined));
}

/**
 * Checks a sign-up code. True only when it is right: the email is then verified and the code used up.
 * Unknown email, already verified, wrong, expired or locked all give false, so the reply never tells who has an account.
 * A wrong try is counted; 5 wrong tries lock the code until a new one is sent.
 */
export async function verifySignupCode(email: string, code: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await lockSignupCode(client, email);
    const usable = row !== null && otpState(toRecord(row), new Date()).usable;
    const right = await bcrypt.compare(code, usable ? row.code_hash : DUMMY_HASH);
    if (row && usable && right) {
      await client.query('UPDATE email_otps SET used_at = now() WHERE id = $1', [row.otp_id]);
      await client.query('UPDATE users SET email_verified_at = now() WHERE id = $1', [row.user_id]);
      await logSecurityEvent({ userId: row.user_id, type: 'EMAIL_VERIFIED', reason: 'The owner entered the sign-up code sent to their email.' }, client);
    } else if (row && usable) {
      await client.query('UPDATE email_otps SET attempts = attempts + 1 WHERE id = $1', [row.otp_id]);
    }
    await client.query('COMMIT');
    return Boolean(row && usable && right);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Sends a new sign-up code to an account that isn't verified yet (used by "Resend code" and by login).
 * Does nothing for an unknown or verified email, or within 60 seconds of the last email. A new code resets the tries.
 */
export async function sendFreshSignupCode(email: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await lockSignupCode(client, email);
    const waitMs = row ? row.last_sent_at.getTime() + ruleConfig.otpResendSeconds * 1000 - Date.now() : 0;
    if (!row || waitMs > 0) {
      await client.query('ROLLBACK');
      return;
    }
    const code = newCode();
    await client.query(
      `UPDATE email_otps SET code_hash = $2, attempts = 0, sends = sends + 1, last_sent_at = now(), expires_at = now() + make_interval(mins => $3)
       WHERE id = $1`,
      [row.otp_id, await bcrypt.hash(code, BCRYPT_ROUNDS), ruleConfig.otpMinutes],
    );
    await client.query('COMMIT');
    emailSignupCode(email, code);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Locks the sign-up code of an account that still needs verifying. Null for an unknown or already verified email. */
async function lockSignupCode(client: PoolClient, email: string): Promise<SignupRow | null> {
  const { rows } = await client.query<SignupRow>(
    `SELECT u.id AS user_id, o.id AS otp_id, o.code_hash, o.expires_at, o.used_at, o.attempts, o.sends, o.last_sent_at
     FROM users u JOIN email_otps o ON o.user_id = u.id AND o.purpose = 'SIGNUP'
     WHERE u.email = $1 AND u.email_verified_at IS NULL
     FOR UPDATE OF o`,
    [email],
  );
  return rows[0] ?? null;
}

/** The row as the pure rule sees it. */
function toRecord(row: SignupRow) {
  return { expiresAt: row.expires_at, usedAt: row.used_at, attempts: row.attempts, sends: row.sends, lastSentAt: row.last_sent_at };
}
