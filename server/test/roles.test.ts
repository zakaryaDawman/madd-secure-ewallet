import request from 'supertest';
import jwt from 'jsonwebtoken';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { config } from '../src/config';
import { pool } from '../src/db/pool';
import { seedAdmin } from '../src/db/seedAdmin';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';

/** Test-only admin details (never the real admin's). */
const ADMIN_ENV = {
  ADMIN_EMAIL: 'admin@madd.test',
  ADMIN_PASSWORD: 'test-admin-pass-1',
  ADMIN_NAME: 'Test Admin',
  ADMIN_PHONE: '019 999 9999',
};

let app: Express;
let customerToken: string;

/** Seeds the test admin and logs in as them. Returns their token. */
async function adminToken(): Promise<string> {
  await seedAdmin(pool, ADMIN_ENV);
  const res = await logIn(app, ADMIN_ENV.ADMIN_EMAIL, ADMIN_ENV.ADMIN_PASSWORD);
  return res.body.token as string;
}

/** Sends a request with this token. */
function send(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, token: string) {
  return request(app)[method](path).set('Authorization', `Bearer ${token}`);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  customerToken = (await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789')).token;
});
afterAll(() => pool.end());

describe('admin routes: customers are refused', () => {
  it.each(['get', 'post', 'put', 'patch', 'delete'] as const)('gives 403 to a customer on %s /admin/me', async (method) => {
    const res = await send(method, '/admin/me', customerToken);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden');
  });

  it('gives 403 on admin paths that do not exist yet', async () => {
    expect((await send('get', '/admin/flags', customerToken)).status).toBe(403);
  });

  it.each(['/ADMIN/me', '/admin/me/', '//admin/me', '/%61dmin/me'])('never lets a customer in through %s', async (path) => {
    const res = await send('get', path, customerToken);
    expect([403, 404]).toContain(res.status);
    expect(res.body.fullName).toBeUndefined();
  });

  it('refuses a customer token whose role was changed to admin', async () => {
    const claims = jwt.decode(customerToken) as jwt.JwtPayload;
    const forged = jwt.sign({ ...claims, role: 'admin' }, 'not-the-server-secret');
    expect((await send('get', '/admin/me', forged)).status).toBe(401);
  });

  it('refuses a token signed with the real secret that says admin, because the database says customer', async () => {
    const claims = jwt.decode(customerToken) as jwt.JwtPayload;
    const forged = jwt.sign({ ...claims, role: 'admin' }, config.jwtSecret);
    expect((await send('get', '/admin/me', forged)).status).toBe(403);
  });

  it('gives 401 with no token', async () => {
    expect((await request(app).get('/admin/me')).status).toBe(401);
  });
});

describe('admin routes: the admin', () => {
  it('gives the admin 200 and their name', async () => {
    const res = await send('get', '/admin/me', await adminToken());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ fullName: 'Test Admin' });
  });

  it('refuses an admin at once after they are demoted', async () => {
    const token = await adminToken();
    await pool.query("UPDATE users SET role = 'customer' WHERE email = $1", [ADMIN_ENV.ADMIN_EMAIL]);
    expect((await send('get', '/admin/me', token)).status).toBe(403);
  });
});

describe('seedAdmin', () => {
  it('creates one admin with hashed secrets and no wallet, and is safe to run twice', async () => {
    const first = await seedAdmin(pool, ADMIN_ENV);
    const second = await seedAdmin(pool, ADMIN_ENV);
    expect(second).toBe(first);
    const { rows } = await pool.query("SELECT id, password_hash, pin_hash FROM users WHERE role = 'admin'");
    expect(rows).toHaveLength(1);
    expect(rows[0].password_hash).toMatch(/^\$2b\$/);
    expect(rows[0].password_hash).not.toContain(ADMIN_ENV.ADMIN_PASSWORD);
    expect(rows[0].pin_hash).toMatch(/^\$2b\$/);
    const wallets = await pool.query('SELECT 1 FROM wallets WHERE user_id = $1', [first]);
    expect(wallets.rows).toHaveLength(0);
  });

  it('refuses missing or weak values without showing the password', async () => {
    await expect(seedAdmin(pool, { ...ADMIN_ENV, ADMIN_PASSWORD: 'short1' })).rejects.toThrow(/at least 12/);
    await expect(seedAdmin(pool, { ...ADMIN_ENV, ADMIN_EMAIL: undefined })).rejects.toThrow();
    await expect(seedAdmin(pool, { ...ADMIN_ENV, ADMIN_PASSWORD: 'short1' })).rejects.not.toThrow(/short1/);
    const { rows } = await pool.query("SELECT 1 FROM users WHERE role = 'admin'");
    expect(rows).toHaveLength(0);
  });

  it('will not turn an existing customer into an admin', async () => {
    await expect(seedAdmin(pool, { ...ADMIN_ENV, ADMIN_EMAIL: 'zak@email.com' })).rejects.toThrow(/customer/);
    const { rows } = await pool.query("SELECT role FROM users WHERE email = 'zak@email.com'");
    expect(rows[0].role).toBe('customer');
  });
});
