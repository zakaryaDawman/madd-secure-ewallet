import bcrypt from 'bcrypt';
import { pool } from '../db/pool';
import type { RegisterInput } from '../validation/register';
import { notify } from './notify';
import { createSignupCode } from './signupCode';

export const BCRYPT_ROUNDS = 12;
export const STARTING_BALANCE_SEN = 100_000; // RM 1,000 demo money

/** Thrown when the email or phone number is already registered. */
export class DuplicateAccountError extends Error {}

/**
 * Hashes the password and PIN, then creates the user (email not verified yet), their wallet, a "Welcome" Inbox item and
 * the sign-up code together. Returns the new user's id and the plain code, to be emailed after the commit (task G4b).
 */
export async function createUserWithWallet(input: RegisterInput): Promise<{ userId: number; code: string }> {
  const [passwordHash, pinHash] = await Promise.all([
    bcrypt.hash(input.password, BCRYPT_ROUNDS),
    bcrypt.hash(input.pin, BCRYPT_ROUNDS),
  ]);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO users (full_name, email, phone, password_hash, pin_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [input.fullName, input.email, input.phone, passwordHash, pinHash],
    );
    const userId = rows[0].id;
    await client.query('INSERT INTO wallets (user_id, balance_sen) VALUES ($1, $2)', [userId, STARTING_BALANCE_SEN]);
    await notify({ userId, kind: 'WELCOME' }, client);
    const code = await createSignupCode(client, userId);
    await client.query('COMMIT');
    return { userId, code };
  } catch (err) {
    await client.query('ROLLBACK');
    if (isUniqueViolation(err)) throw new DuplicateAccountError();
    throw err;
  } finally {
    client.release();
  }
}

/** True if a database error means "this value already exists" (Postgres code 23505). */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

/** The user's current role from the database, or null if the account no longer exists. */
export async function userRole(userId: number): Promise<'customer' | 'admin' | null> {
  const { rows } = await pool.query<{ role: 'customer' | 'admin' }>('SELECT role FROM users WHERE id = $1', [userId]);
  return rows[0]?.role ?? null;
}
