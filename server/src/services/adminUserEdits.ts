import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import type { PoolClient } from 'pg';
import type { AddUserInput, EditUserInput } from '../validation/adminUser';
import { maskEmail, maskPhone } from '../utils/mask';
import { inTransaction, lockCustomer, type AdminActionError, type AdminActionResult } from './adminActions';
import { BCRYPT_ROUNDS, isUniqueViolation } from './users';
import { notify } from './notify';
import { endAllSessions } from './sessions';
import { logSecurityEvent } from './securityLog';
import { createSignupCode, emailSignupCode, replaceSignupCode, type AccountCodePurpose } from './signupCode';

export type AddUserResult = { ok: true; userId: number } | { ok: false; error: 'duplicate' };

type CurrentDetails = { full_name: string; email: string; phone: string; invite_pending: boolean };

/**
 * Admin adds a customer (task G10): a RM 0 wallet (admins never create money), no usable password or PIN (both are
 * hashes of throw-away random values), and an INVITE code emailed after the commit so the customer sets their own.
 */
export async function addUser(adminId: number, input: AddUserInput): Promise<AddUserResult> {
  const [passwordHash, pinHash] = await Promise.all([throwAwayHash(), throwAwayHash()]);
  try {
    const result = await inTransaction(async (client) => {
      const { rows } = await client.query<{ id: number }>(
        'INSERT INTO users (full_name, email, phone, password_hash, pin_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [input.fullName, input.email, input.phone, passwordHash, pinHash],
      );
      const userId = rows[0].id;
      await client.query('INSERT INTO wallets (user_id, balance_sen) VALUES ($1, 0)', [userId]);
      await notify({ userId, kind: 'WELCOME' }, client);
      const code = await createSignupCode(client, userId, 'INVITE');
      await logSecurityEvent({ userId, type: 'ADMIN_ADD_USER', reason: 'Added by an admin. An invite code was emailed to the customer.', actorId: adminId }, client);
      return { ok: true as const, userId, code };
    });
    emailSignupCode(input.email, result.code, 'INVITE');
    return { ok: true, userId: result.userId };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: 'duplicate' };
    throw err;
  }
}

/**
 * Admin edits a customer's name, email or phone with a written reason, logged with the old and new values masked.
 * A new email must be proved again: it becomes unverified, every session ends and a fresh code goes to the new address.
 */
export async function editUser(adminId: number, userId: number, input: EditUserInput): Promise<AdminActionResult> {
  try {
    const result = await inTransaction(async (client) => {
      const refusal = await refuseChange(client, userId);
      if (refusal) return { ok: false as const, error: refusal };
      const current = await currentDetails(client, userId);
      const changes = changedFields(current, input);
      if (changes.length === 0) return { ok: false as const, error: 'no_change' as const };
      await client.query('UPDATE users SET full_name = $2, email = $3, phone = $4 WHERE id = $1', [
        userId,
        input.fullName ?? current.full_name,
        input.email ?? current.email,
        input.phone ?? current.phone,
      ]);
      const code = input.email !== undefined && input.email !== current.email ? await restartEmailCheck(client, userId, current.invite_pending) : null;
      await logSecurityEvent({ userId, type: 'ADMIN_EDIT_USER', reason: input.reason, details: { changes }, actorId: adminId }, client);
      return { ok: true as const, code };
    });
    if (result.ok && result.code && input.email) emailSignupCode(input.email, result.code.value, result.code.purpose);
    return result.ok ? { ok: true } : result;
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: 'duplicate' };
    throw err;
  }
}

/**
 * Admin deactivates a customer (task G10). Only with a RM 0 balance, so no money is stranded. Held transfers from or
 * to them are cancelled, every session ends, and they can't sign in or be paid again. Nothing is deleted.
 */
export async function deactivateUser(adminId: number, userId: number, reason: string): Promise<AdminActionResult> {
  return inTransaction(async (client) => {
    const refusal = await refuseChange(client, userId);
    if (refusal) return { ok: false, error: refusal };
    const { rows } = await client.query<{ balance_sen: string }>('SELECT balance_sen FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
    if (Number(rows[0]?.balance_sen ?? 0) > 0) return { ok: false, error: 'balance_not_zero' };
    await client.query("UPDATE transactions SET status = 'CANCELLED' WHERE (sender_id = $1 OR receiver_id = $1) AND status = 'PENDING'", [userId]);
    await client.query('UPDATE users SET deactivated_at = now() WHERE id = $1', [userId]);
    await endAllSessions(client, userId, 'admin');
    await logSecurityEvent({ userId, type: 'ADMIN_DEACTIVATE', reason, actorId: adminId }, client);
    return { ok: true };
  });
}

/** Locks the customer; says why no change is allowed (not a customer, or already deactivated), or null to go ahead. */
async function refuseChange(client: PoolClient, userId: number): Promise<AdminActionError | null> {
  const user = await lockCustomer(client, userId);
  if (!user) return 'not_found';
  return user.deactivated ? 'deactivated' : null;
}

/** The customer's details now, and whether they still haven't accepted their invite. */
async function currentDetails(client: PoolClient, userId: number): Promise<CurrentDetails> {
  const { rows } = await client.query<CurrentDetails>(
    `SELECT full_name, email, phone,
            EXISTS (SELECT 1 FROM email_otps o WHERE o.user_id = u.id AND o.purpose = 'INVITE' AND o.used_at IS NULL) AS invite_pending
     FROM users u WHERE id = $1`,
    [userId],
  );
  return rows[0];
}

/** Which details really change, with old and new values masked for the security log. */
function changedFields(current: CurrentDetails, input: EditUserInput): { field: string; from: string; to: string }[] {
  const changes: { field: string; from: string; to: string }[] = [];
  if (input.fullName !== undefined && input.fullName !== current.full_name) changes.push({ field: 'name', from: current.full_name, to: input.fullName });
  if (input.email !== undefined && input.email !== current.email) changes.push({ field: 'email', from: maskEmail(current.email), to: maskEmail(input.email) });
  if (input.phone !== undefined && input.phone !== current.phone) changes.push({ field: 'phone', from: maskPhone(current.phone), to: maskPhone(input.phone) });
  return changes;
}

/** After an email change: marks it unverified, ends every session and makes a new code (the invite one if still pending). */
async function restartEmailCheck(client: PoolClient, userId: number, invitePending: boolean): Promise<{ value: string; purpose: AccountCodePurpose }> {
  await client.query('UPDATE users SET email_verified_at = NULL WHERE id = $1', [userId]);
  await endAllSessions(client, userId, 'admin');
  const purpose: AccountCodePurpose = invitePending ? 'INVITE' : 'SIGNUP';
  return { value: await replaceSignupCode(client, userId, purpose), purpose };
}

/** A bcrypt hash of a random value nobody knows, so an invited account can't be signed in to before it is accepted. */
async function throwAwayHash(): Promise<string> {
  return bcrypt.hash(randomBytes(32).toString('hex'), BCRYPT_ROUNDS);
}
