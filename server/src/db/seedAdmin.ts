import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { adminSeedSchema } from '../validation/adminSeed';
import { BCRYPT_ROUNDS } from '../services/users';

/** Thrown when the seed can't run; the message says what to fix and never contains the password. */
export class SeedAdminError extends Error {}

/**
 * Creates the admin account from the ADMIN_* values, or updates it if it already exists (safe to run again).
 * The admin gets no wallet, and its PIN is hashed from a random value nobody knows. Returns the admin's id.
 */
export async function seedAdmin(db: Pool, env: Record<string, string | undefined>): Promise<number> {
  const parsed = adminSeedSchema.safeParse(env);
  if (!parsed.success) throw new SeedAdminError(parsed.error.issues.map((issue) => issue.message).join('\n'));
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE } = parsed.data;

  const [passwordHash, pinHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS),
    bcrypt.hash(crypto.randomBytes(32).toString('hex'), BCRYPT_ROUNDS),
  ]);
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO users (full_name, email, phone, password_hash, pin_hash, role, email_verified_at)
     VALUES ($1, $2, $3, $4, $5, 'admin', now())
     ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, password_hash = EXCLUDED.password_hash
       WHERE users.role = 'admin'
     RETURNING id`,
    [ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, passwordHash, pinHash],
  );
  if (rows.length === 0) throw new SeedAdminError('ADMIN_EMAIL belongs to a customer account. Use another email.');
  return rows[0].id;
}

/** Command-line entry: `npm run db:seed-admin` reads the ADMIN_* values from .env. Prints no secrets. */
async function main() {
  const { pool } = await import('./pool');
  try {
    await seedAdmin(pool, process.env);
    console.log('Admin account is ready.');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof SeedAdminError ? err.message : err);
    process.exit(1);
  });
}
