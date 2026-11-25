import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { seedAdmin } from '../src/db/seedAdmin';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';

const ADMIN_ENV = { ADMIN_EMAIL: 'admin@madd.test', ADMIN_PASSWORD: 'test-admin-pass-1', ADMIN_NAME: 'Test Admin', ADMIN_PHONE: '019 999 9999' };
const NEW_PHONE = '22222222-2222-4222-8222-222222222222';
const REASON = 'Verified by phone call with the owner.';

let app: Express;
let admin: string;
let zak: { id: number; token: string };
let ahmad: { id: number; token: string };

/** GET as the admin (or another token). */
function get(path: string, token = admin) {
  return request(app).get(path).set('Authorization', `Bearer ${token}`);
}

/** POST as the admin (or another token). */
function post(path: string, body: object, token = admin) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

/** Zakarya freezes his own account by saying No to a held RM 800 transfer (rule R1). */
async function zakSaysNo(): Promise<void> {
  const { body } = await post('/transfers', { recipientPhone: '012 345 4521', amountSen: 80_000, note: '', pin: '482913' }, zak.token);
  await post(`/transfers/${body.id}/reject`, {}, zak.token);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
  await seedAdmin(pool, ADMIN_ENV);
  admin = (await logIn(app, ADMIN_ENV.ADMIN_EMAIL, ADMIN_ENV.ADMIN_PASSWORD)).body.token;
});
afterAll(() => pool.end());

describe('Users list (design 24)', () => {
  it('lists customers (not admins) with status, line and counts', async () => {
    await zakSaysNo();
    for (let i = 0; i < 5; i++) await logIn(app, 'ahmad@email.com', 'wrongpass99');
    const { body } = await get('/admin/users');
    expect(body.counts).toEqual({ total: 2, frozen: 1, locked: 1 });
    expect(body.users.map((u: { fullName: string; status: string; line: string }) => [u.fullName, u.status, u.line])).toEqual([
      ['Ahmad Ali', 'locked', expect.stringMatching(/^Sign-in locked · 1[45] min left$/)],
      ['Zakarya Dawman', 'frozen', expect.stringMatching(/^Frozen by user · /)],
    ]);
  });

  it('searches by name, email or phone, safely', async () => {
    const names = async (q: string) => (await get(`/admin/users?q=${encodeURIComponent(q)}`)).body.users.map((u: { fullName: string }) => u.fullName);
    expect(await names('zak')).toEqual(['Zakarya Dawman']);
    expect(await names('ahmad@email')).toEqual(['Ahmad Ali']);
    expect(await names('4521')).toEqual(['Ahmad Ali']);
    expect(await names("%' OR 1=1 --")).toEqual([]);
  });

  it('filters by Frozen', async () => {
    await zakSaysNo();
    expect((await get('/admin/users?filter=frozen')).body.users.map((u: { fullName: string }) => u.fullName)).toEqual(['Zakarya Dawman']);
  });
});

describe('User details (design 23)', () => {
  it('shows contact, balance, devices, events and who froze it, but never secrets', async () => {
    await logIn(app, 'zak@email.com', 'password12', NEW_PHONE);
    await zakSaysNo();
    const { body } = await get(`/admin/users/${zak.id}`);
    expect(body).toMatchObject({ fullName: 'Zakarya Dawman', email: 'zak@email.com', phone: '+60 12-345 6789', status: 'frozen', balanceSen: 100_000 });
    expect(body.devices.map((d: { trusted: boolean }) => d.trusted)).toEqual([true, false]);
    expect(body.freeze).toMatchObject({ by: 'User (pressed No)', trigger: 'R1 Large amount' });
    expect(JSON.stringify(body)).not.toMatch(/\$2b\$|password|pin_hash|push_token/);
  });

  it('does not show admins, and gives 404 for an unknown id', async () => {
    const { rows } = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    expect((await get(`/admin/users/${rows[0].id}`)).status).toBe(404);
    expect((await get('/admin/users/99999')).status).toBe(404);
  });
});

describe('Unfreeze needs a reason (design 25)', () => {
  it('refuses without a reason, or with one that is too short', async () => {
    await zakSaysNo();
    expect((await post(`/admin/users/${zak.id}/unfreeze`, {})).status).toBe(400);
    expect((await post(`/admin/users/${zak.id}/unfreeze`, { reason: 'ok' })).status).toBe(400);
    expect((await get(`/admin/users/${zak.id}`)).body.status).toBe('frozen');
  });

  it('unfreezes with a reason, logs who did it and why, and the user can log in again', async () => {
    await zakSaysNo();
    expect((await post(`/admin/users/${zak.id}/unfreeze`, { reason: REASON })).status).toBe(204);
    const { rows } = await pool.query(
      "SELECT e.reason, a.full_name AS admin FROM security_events e JOIN users a ON a.id = e.actor_id WHERE e.type = 'ADMIN_UNFREEZE'",
    );
    expect(rows).toEqual([{ reason: REASON, admin: 'Test Admin' }]);
    const log = (await get('/admin/logs?q=unfreeze')).body.entries[0];
    expect(log).toMatchObject({ code: 'ADMIN_UNFREEZE', name: 'by Test Admin', line: `Zakarya D. · Reason: ${REASON}` });
    expect((await logIn(app, 'zak@email.com', 'password12')).status).toBe(200);
  });

  it('refuses to unfreeze an account that is not frozen', async () => {
    expect((await post(`/admin/users/${zak.id}/unfreeze`, { reason: REASON })).status).toBe(409);
  });
});

describe('Admin freeze and trust', () => {
  it('freezing logs out every phone and is logged with the admin and reason', async () => {
    expect((await post(`/admin/users/${zak.id}/freeze`, { reason: 'Reported stolen phone by the owner.' })).status).toBe(204);
    expect((await get('/wallet', zak.token)).body.error).toBe('account_frozen');
    expect((await get(`/admin/users/${zak.id}`)).body.freeze.by).toBe('Admin');
    const { rows } = await pool.query("SELECT type FROM security_events WHERE actor_id IS NOT NULL");
    expect(rows).toEqual([{ type: 'ADMIN_FREEZE' }]);
  });

  it('trusting a device lets its transfers through, and is logged', async () => {
    const newPhone = (await logIn(app, 'zak@email.com', 'password12', NEW_PHONE)).body.token;
    expect((await post(`/admin/users/${zak.id}/devices/${NEW_PHONE}/trust`, { reason: REASON })).status).toBe(204);
    expect((await post('/transfers', { recipientPhone: '012 345 4521', amountSen: 1_000, note: '', pin: '482913' }, newPhone)).status).toBe(201);
    const { rows } = await pool.query("SELECT reason FROM security_events WHERE type = 'ADMIN_TRUST_DEVICE'");
    expect(rows).toEqual([{ reason: `Test Phone: ${REASON}` }]);
  });
});

describe('what admins can never do, and customers can never reach', () => {
  it('an admin cannot send money or change a balance (no such routes; wallet routes refuse admins)', async () => {
    expect((await post('/transfers', { recipientPhone: '012 345 4521', amountSen: 1_000, note: '', pin: '482913' })).status).toBe(403);
    // Edit user (task G10) only takes name, email and phone: a balance in the body is refused and nothing changes.
    expect((await request(app).patch(`/admin/users/${zak.id}`).set('Authorization', `Bearer ${admin}`).send({ balanceSen: 1, reason: REASON })).status).toBe(400);
    expect((await pool.query('SELECT balance_sen FROM wallets WHERE user_id = $1', [zak.id])).rows[0].balance_sen).toBe('100000');
    expect((await post(`/admin/users/${zak.id}/balance`, { balanceSen: 1, reason: REASON })).status).toBe(404);
  });

  it.each([
    ['get', '/admin/users'],
    ['get', '/admin/users/1'],
    ['post', '/admin/users/1/unfreeze'],
    ['post', '/admin/users/1/freeze'],
    ['post', `/admin/users/1/devices/${NEW_PHONE}/trust`],
  ] as const)('a customer gets 403 on %s %s', async (method, path) => {
    expect((await request(app)[method](path).set('Authorization', `Bearer ${ahmad.token}`).send({ reason: REASON })).status).toBe(403);
  });
});
