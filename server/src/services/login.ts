import bcrypt from 'bcrypt';
import { pool } from '../db/pool';
import type { LoginInput } from '../validation/login';
import type { TokenClaims } from '../auth/tokens';

/** A real bcrypt hash of a random value. Checked when the email doesn't exist, so a wrong email takes as long as a wrong password. */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO5x0Pq4Gx2bEdzyzMOrM4vh1Y7MiG.Wy';

export type LoggedInUser = TokenClaims & { fullName: string };

/** Returns the user if the email and password match, otherwise null (without saying which one was wrong). */
export async function checkCredentials(input: LoginInput): Promise<LoggedInUser | null> {
  const { rows } = await pool.query<{ id: number; full_name: string; role: TokenClaims['role']; password_hash: string }>(
    'SELECT id, full_name, role, password_hash FROM users WHERE email = $1',
    [input.email],
  );
  const user = rows[0];
  const passwordMatches = await bcrypt.compare(input.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !passwordMatches) return null;
  return { userId: user.id, role: user.role, fullName: user.full_name };
}
