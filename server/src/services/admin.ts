import { pool } from '../db/pool';

/** The admin's full name. */
export async function adminName(userId: number): Promise<string> {
  const { rows } = await pool.query<{ full_name: string }>('SELECT full_name FROM users WHERE id = $1', [userId]);
  return rows[0].full_name;
}
