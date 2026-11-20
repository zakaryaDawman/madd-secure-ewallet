import { Pool } from 'pg';
import { config } from '../config';

/** Shared connection pool to PostgreSQL, used by every query. */
export const pool = new Pool({ connectionString: config.databaseUrl });

/** Returns true if the database answers a simple query. */
export async function isDatabaseUp(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
