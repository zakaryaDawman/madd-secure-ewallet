import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { seedAdmin } from '../src/db/seedAdmin';
import { codeEmailsSettled } from '../src/services/emailOtp';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';

const ADMIN_ENV = { ADMIN_EMAIL: 'admin@madd.test', ADMIN_PASSWORD: 'test-admin-pass-1', ADMIN_NAME: 'Test Admin', ADMIN_PHONE: '019 999 9999' };
const CONSOLE = 'http://localhost:5173';

let app: Express;
let admin: string;
let zak: { id: number; token: string };

/** GET as someone. */
function get(path: string, token: string) {
  return request(app).get(path).set('Authorization', `Bearer ${token}`);
}

/** Zakarya sends money to Ahmad. */
function send(amountSen: number) {
  return request(app)
    .post('/transfers')
    .set('Authorization', `Bearer ${zak.token}`)
    .send({ recipientPhone: '012 345 4521', amountSen, note: '', pin: '482913' });
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
  await seedAdmin(pool, ADMIN_ENV);
  admin = (await logIn(app, ADMIN_ENV.ADMIN_EMAIL, ADMIN_ENV.ADMIN_PASSWORD)).body.token;
});
afterAll(() => pool.end());

describe('GET /admin/stats (design 20)', () => {
  it('starts at zero', async () => {
    const res = await get('/admin/stats', admin);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ alertsToday: 0, heldNow: 0, frozenAccounts: 0, lockedSignIns: 0, byRuleTotal: 0, latest: [] });
  });

  it('counts a held transfer, a frozen account and a locked sign-in', async () => {
    await send(80_000); // R1 holds it
    for (let i = 0; i < 5; i++) await logIn(app, 'ahmad@email.com', 'wrongpass99'); // R4 locks Ahmad's sign-in
    await pool.query("UPDATE users SET frozen_at = now() WHERE email = 'ahmad@email.com'");
    const { body } = await get('/admin/stats', admin);
    expect(body).toMatchObject({ alertsToday: 2, heldNow: 1, frozenAccounts: 1, lockedSignIns: 1 });
    expect(body.byRule).toEqual([
      { rule: 'R1', count: 1 },
      { rule: 'R2', count: 0 },
      { rule: 'R3', count: 0 },
      { rule: 'R4', count: 1 },
    ]);
    expect(body.byRuleTotal).toBe(2);
  });

  it('does not count a held transfer whose 5 minutes ran out', async () => {
    await send(80_000);
    await pool.query("UPDATE transactions SET expires_at = now() - interval '1 second'");
    expect((await get('/admin/stats', admin)).body.heldNow).toBe(0);
  });

  it('shows the latest events newest first, with short names and nothing secret', async () => {
    await send(80_000);
    await codeEmailsSettled();
    await logIn(app, 'zak@email.com', 'password12', '22222222-2222-4222-8222-222222222222'); // R3 new device
    const { body } = await get('/admin/stats', admin);
    expect(body.latest.map((e: { name: string; text: string; tone: string }) => [e.name, e.text, e.tone])).toEqual([
      ['Zakarya D.', 'R3 new device', 'info'],
      ['Zakarya D.', 'Email code sent', 'info'],
      ['Zakarya D.', 'R1 held RM 800', 'warning'],
    ]);
    expect(JSON.stringify(body)).not.toMatch(/\$2b\$|password|pin_hash|zak@email|\+6012/);
  });
});

describe('roles', () => {
  it('a customer cannot see the stats', async () => {
    expect((await get('/admin/stats', zak.token)).status).toBe(403);
  });

  it.each(['/wallet', '/transactions', '/notifications', '/users/lookup?phone=0123454521'])('an admin cannot use the wallet: %s gives 403', async (path) => {
    expect((await get(path, admin)).status).toBe(403);
  });

  it('an admin cannot send money', async () => {
    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${admin}`)
      .send({ recipientPhone: '012 345 4521', amountSen: 1_000, note: '', pin: '482913' });
    expect(res.status).toBe(403);
  });
});

describe('CORS: only the admin console may call the API from a browser', () => {
  it('allows the admin console', async () => {
    const res = await request(app).options('/admin/stats').set('Origin', CONSOLE);
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(CONSOLE);
  });

  it('gives any other website no permission', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
