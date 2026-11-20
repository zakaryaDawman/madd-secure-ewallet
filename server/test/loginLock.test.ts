import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { seedAdmin } from '../src/db/seedAdmin';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';

const ADMIN_ENV = { ADMIN_EMAIL: 'admin@madd.test', ADMIN_PASSWORD: 'test-admin-pass-1', ADMIN_NAME: 'Test Admin', ADMIN_PHONE: '019 999 9999' };

let app: Express;

/** Tries to log in `count` times with a wrong password. Returns the last answer. */
async function wrongPasswords(email: string, count: number) {
  let res = await logIn(app, email, 'wrongpass99');
  for (let i = 1; i < count; i++) res = await logIn(app, email, 'wrongpass99');
  return res;
}

/** Moves every login attempt `minutes` into the past, as if that much time went by. */
async function waitMinutes(minutes: number): Promise<void> {
  await pool.query('UPDATE login_attempts SET created_at = created_at - make_interval(mins => $1)', [minutes]);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
});
afterAll(() => pool.end());

describe('R4: sign-in lock after 5 wrong passwords', () => {
  it('4 wrong passwords give the usual message', async () => {
    const res = await wrongPasswords('zak@email.com', 4);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_login');
  });

  it('the 5th wrong password locks sign-in for 15 minutes (design 27 countdown)', async () => {
    const res = await wrongPasswords('zak@email.com', 5);
    expect(res.status).toBe(423);
    expect(res.body.error).toBe('login_locked');
    expect(res.body.secondsLeft).toBeGreaterThan(895);
    expect(res.body.secondsLeft).toBeLessThanOrEqual(900);
  });

  it('refuses even the right password while locked, and gives no token', async () => {
    await wrongPasswords('zak@email.com', 5);
    const res = await logIn(app, 'zak@email.com', 'password12');
    expect(res.status).toBe(423);
    expect(res.body.token).toBeUndefined();
  });

  it('is still locked after 14 minutes and lets the right password in after 15', async () => {
    await wrongPasswords('zak@email.com', 5);
    await waitMinutes(14);
    expect((await logIn(app, 'zak@email.com', 'password12')).status).toBe(423);
    await waitMinutes(1);
    expect((await logIn(app, 'zak@email.com', 'password12')).status).toBe(200);
  });

  it('locked tries are not recorded, so they cannot stretch the lock', async () => {
    await wrongPasswords('zak@email.com', 8);
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM login_attempts WHERE email = 'zak@email.com' AND NOT success");
    expect(rows[0].n).toBe(5);
  });

  it('logs R4 once in the security log', async () => {
    await wrongPasswords('zak@email.com', 7);
    const { rows } = await pool.query("SELECT rule FROM security_events WHERE type = 'RULE_FIRED'");
    expect(rows).toEqual([{ rule: 'R4' }]);
  });

  it('gives the same answer for an email with no account, so nobody can tell who uses MADD', async () => {
    const real = await wrongPasswords('zak@email.com', 5);
    const fake = await wrongPasswords('nobody@email.com', 5);
    expect(fake.status).toBe(real.status);
    expect(Object.keys(fake.body).sort()).toEqual(Object.keys(real.body).sort());
    expect(fake.body.message).toBe(real.body.message);
  });

  it('does not lock other accounts', async () => {
    await wrongPasswords('nobody@email.com', 5);
    expect((await logIn(app, 'zak@email.com', 'password12')).status).toBe(200);
  });

  it('locks the admin too', async () => {
    await seedAdmin(pool, ADMIN_ENV);
    await wrongPasswords(ADMIN_ENV.ADMIN_EMAIL, 5);
    expect((await logIn(app, ADMIN_ENV.ADMIN_EMAIL, ADMIN_ENV.ADMIN_PASSWORD)).status).toBe(423);
  });
});
