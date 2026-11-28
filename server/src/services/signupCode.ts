import bcrypt from 'bcrypt';
import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { ruleConfig } from '../rules/config';
import { otpState, type OtpRecord } from '../rules/otpCheck';
import { BCRYPT_ROUNDS } from './users';
import { inBackground, newCode } from './emailOtp';
import { logSecurityEvent } from './securityLog';
import { sendMail } from './mailer';
import { brandedEmail } from './mailTemplate';

/** A bcrypt hash of a random value, compared when the email has no code, so every "wrong code" takes the same time. */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO5x0Pq4Gx2bEdzyzMOrM4vh1Y7MiG.Wy';

/** Which account code: SIGNUP proves a self-registered email, INVITE lets an admin-added customer set a password and PIN (G10). */
export type AccountCodePurpose = 'SIGNUP' | 'INVITE';

type SignupRow = { user_id: number; otp_id: number; code_hash: string; expires_at: Date; used_at: Date | null; attempts: number; sends: number; last_sent_at: Date };

/** Makes the account code inside the caller's transaction and saves only its hash. Returns the plain code to email after the commit. */
export async function createSignupCode(client: PoolClient, userId: number, purpose: AccountCodePurpose = 'SIGNUP'): Promise<string> {
  const code = newCode();
  await client.query(
    `INSERT INTO email_otps (user_id, purpose, code_hash, expires_at) VALUES ($1, $2, $3, now() + make_interval(mins => $4))`,
    [userId, purpose, await bcrypt.hash(code, BCRYPT_ROUNDS), ruleConfig.otpMinutes],
  );
  return code;
}

/** Gives the user a brand-new account code in place of any old one (an admin changed their email, task G10). */
export async function replaceSignupCode(client: PoolClient, userId: number, purpose: AccountCodePurpose): Promise<string> {
  await client.query('DELETE FROM email_otps WHERE user_id = $1 AND purpose = $2', [userId, purpose]);
  return createSignupCode(client, userId, purpose);
}

/** The email text for each kind of account code. */
const CODE_EMAILS: Record<AccountCodePurpose, { title: string; action: string; ignore: string }> = {
  SIGNUP: { title: 'Your MADD sign-up code', action: 'finish creating your account', ignore: "If you didn't sign up for MADD, ignore this email." },
  INVITE: { title: 'You are invited to MADD', action: 'set your password and PIN (tap "I have an invite" on the sign-in screen)', ignore: "If you didn't expect this, ignore this email." },
};

/** Emails the account code in the background, so the request never waits for Gmail. */
export function emailSignupCode(email: string, code: string, purpose: AccountCodePurpose = 'SIGNUP'): void {
  const { title, action, ignore } = CODE_EMAILS[purpose];
  const lines = [
    `Your code is ${code}`,
    `Enter it in MADD to ${action}. It works for ${ruleConfig.otpMinutes} minutes.`,
    `${ignore} Never share this code with anyone.`,
  ];
  inBackground(sendMail(email, title, lines.join('\n\n'), brandedEmail(title, lines.slice(1), code)).then(() => undefined));
}

/**
 * Checks an account code. True only when it is right: the email is then verified, the code used up, and `onRight`
 * runs in the same transaction (the invite sets the password and PIN there).
 * Unknown email, already verified, wrong, expired or locked all give false, so the reply never tells who has an account.
 * A wrong try is counted; 5 wrong tries lock the code until a new one is sent.
 */
export async function verifySignupCode(
  email: string,
  code: string,
  purpose: AccountCodePurpose = 'SIGNUP',
  onRight?: (client: PoolClient, userId: number) => Promise<void>,
): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await lockSignupCode(client, email, purpose);
    const usable = row !== null && otpState(toRecord(row), new Date()).usable;
    const right = await bcrypt.compare(code, usable ? row.code_hash : DUMMY_HASH);
    if (row && usable && right) {
      await client.query('UPDATE email_otps SET used_at = now() WHERE id = $1', [row.otp_id]);
      await client.query('UPDATE users SET email_verified_at = now() WHERE id = $1', [row.user_id]);
      if (onRight) await onRight(client, row.user_id);
      else await logSecurityEvent({ userId: row.user_id, type: 'EMAIL_VERIFIED', reason: 'The owner entered the sign-up code sent to their email.' }, client);
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
 * Sends a new account code to an account that isn't verified yet (used by "Resend code" and by login).
 * Does nothing for an unknown or verified email, or within 60 seconds of the last email. A new code resets the tries.
 */
export async function sendFreshSignupCode(email: string, purpose: AccountCodePurpose = 'SIGNUP'): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await lockSignupCode(client, email, purpose);
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
    emailSignupCode(email, code, purpose);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Locks the account code of an account that still needs verifying. Null for an unknown, verified or deactivated email. */
async function lockSignupCode(client: PoolClient, email: string, purpose: AccountCodePurpose): Promise<SignupRow | null> {
  const { rows } = await client.query<SignupRow>(
    `SELECT u.id AS user_id, o.id AS otp_id, o.code_hash, o.expires_at, o.used_at, o.attempts, o.sends, o.last_sent_at
     FROM users u JOIN email_otps o ON o.user_id = u.id AND o.purpose = $2
     WHERE u.email = $1 AND u.email_verified_at IS NULL AND u.deactivated_at IS NULL
     FOR UPDATE OF o`,
    [email, purpose],
  );
  return rows[0] ?? null;
}

/** The row as the pure rule sees it. */
function toRecord(row: SignupRow): OtpRecord {
  return { expiresAt: row.expires_at, usedAt: row.used_at, attempts: row.attempts, sends: row.sends, lastSentAt: row.last_sent_at };
}
