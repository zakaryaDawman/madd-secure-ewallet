import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

/** Creates or updates all tables by running schema.sql on the given database. */
export async function migrate(db: Pool): Promise<void> {
  await db.query(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

/** Command-line entry: `npm run db:migrate` applies the schema to the database in .env. */
async function main() {
  const { pool } = await import('./pool');
  await migrate(pool);
  console.log('Database schema is up to date.');
  await pool.end();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
