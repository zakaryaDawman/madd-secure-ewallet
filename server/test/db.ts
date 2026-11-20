import { pool } from '../src/db/pool';
import { migrate } from '../src/db/migrate';

/** Creates the tables in the test database (once per test file). */
export async function prepareTestDatabase(): Promise<void> {
  await migrate(pool);
}

/**
 * Empties every table so each test starts from a clean database. security_events refuses to be emptied,
 * so its guard triggers are switched off just for this, and only ever in the test database.
 */
export async function clearTables(): Promise<void> {
  await pool.query(`
    ALTER TABLE security_events DISABLE TRIGGER USER;
    TRUNCATE security_events, notifications, push_log, pin_attempts, login_attempts, known_devices, sessions, transactions, wallets, users RESTART IDENTITY CASCADE;
    ALTER TABLE security_events ENABLE TRIGGER USER;`);
}
