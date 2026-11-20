import { pool } from '../src/db/pool';
import { migrate } from '../src/db/migrate';

/** Creates the tables in the test database (once per test file). */
export async function prepareTestDatabase(): Promise<void> {
  await migrate(pool);
}

/** Empties every table so each test starts from a clean database. */
export async function clearTables(): Promise<void> {
  await pool.query('TRUNCATE sessions, transactions, wallets, users RESTART IDENTITY CASCADE');
}
