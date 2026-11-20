import bcrypt from 'bcrypt';
import { pool } from '../db/pool';
import type { RegisterInput } from '../validation/register';

const BCRYPT_ROUNDS = 12;
export const STARTING_BALANCE_SEN = 100_000; // RM 1,000 demo money

/** Thrown when the email or phone number is already registered. */
export class DuplicateAccountError extends Error {}

/** Hashes the password and PIN, then creates the user and their wallet together. Returns the new user's id. */
export async function createUserWithWallet(input: RegisterInput): Promise<number> {
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
    await client.query('COMMIT');
    return userId;
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
