import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { seedAdmin } from '../src/db/seedAdmin';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';
import { lastCode, mailbox } from './mailbox';

const ADMIN_ENV = { ADMIN_EMAIL: 'admin@madd.test', ADMIN_PASSWORD: 'test-admin-pass-1', ADMIN_NAME: 'Test Admin', ADMIN_PHONE: '019 999 9999' };
const REASON = 'Requested by the customer at the branch.';
const NEW_CUSTOMER = { fullName: 'Nur Aisyah', email: 'nur@email.com', phone: '012 555 0001' };

let app: Express;
let admin: string;
let adminId: number;
let zak: { id: number; token: string };

/** Sends a request as the admin (or another token). */
function send(method: 'post' | 'patch', path: string, body: object, token = admin) {
  return request(app)[method](path).set('Authorization', `Bearer ${token}`).send(body);
}

/** The newest security event of this type for the user. */
async function lastEvent(userId: number, type: string) {
  const { rows } = await pool.query('SELECT reason, details, actor_id FROM security_events WHERE user_id = $1 AND type = $2 ORDER BY id DESC LIMIT 1', [userId, type]);
  return rows[0];
}

/** Sets a wallet balance straight in the database (deactivating needs RM 0). */
async function setBalance(userId: number, sen: number): Promise<void> {
  await pool.query('UPDATE wallets SET balance_sen = $2 WHERE user_id = $1', [userId, sen]);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  await seedAdmin(pool, ADMIN_ENV);
  const login = await logIn(app, ADMIN_ENV.ADMIN_EMAIL, ADMIN_ENV.ADMIN_PASSWORD);
  admin = login.body.token;
  adminId = login.body.user.id;
});
afterAll(() => pool.end());

describe('only admins', () => {
  it('refuses customers on add, edit and deactivate', async () => {
    expect((await send('post', '/admin/users', NEW_CUSTOMER, zak.token)).status).toBe(403);
    expect((await send('patch', `/admin/users/${zak.id}`, { fullName: 'Hacked', reason: REASON }, zak.token)).status).toBe(403);
    expect((await send('post', `/admin/users/${zak.id}/deactivate`, { reason: REASON }, zak.token)).status).toBe(403);
  });

  it('never edits or deactivates an admin account', async () => {
    expect((await send('patch', `/admin/users/${adminId}`, { fullName: 'Other Name', reason: REASON })).status).toBe(404);
    expect((await send('post', `/admin/users/${adminId}/deactivate`, { reason: REASON })).status).toBe(404);
  });
});

describe('Add user (invite)', () => {
  it('creates a RM 0 customer, logs it and emails an invite code', async () => {
    const res = await send('post', '/admin/users', NEW_CUSTOMER);
    expect(res.status).toBe(201);
    const { rows } = await pool.query('SELECT u.phone, u.email_verified_at, w.balance_sen FROM users u JOIN wallets w ON w.user_id = u.id WHERE u.id = $1', [res.body.userId]);
    expect(rows[0]).toEqual({ phone: '+60125550001', email_verified_at: null, balance_sen: '0' });
    expect((await lastEvent(res.body.userId, 'ADMIN_ADD_USER')).actor_id).toBe(adminId);
    expect(await lastCode(NEW_CUSTOMER.email)).toMatch(/^\d{6}$/);
    expect(mailbox.find((m) => m.to === NEW_CUSTOMER.email)?.subject).toBe('You are invited to MADD');
  });

  it('refuses a duplicate email or phone with one message', async () => {
    const byEmail = await send('post', '/admin/users', { ...NEW_CUSTOMER, email: 'zak@email.com' });
    const byPhone = await send('post', '/admin/users', { ...NEW_CUSTOMER, phone: '0123456789' });
    expect([byEmail.status, byPhone.status]).toEqual([409, 409]);
    expect(byEmail.body).toEqual(byPhone.body);
  });

  it('refuses a password or PIN sent by the admin', async () => {
    expect((await send('post', '/admin/users', { ...NEW_CUSTOMER, password: 'password12', pin: '482913' })).status).toBe(400);
  });

  it('the invited customer cannot sign in until they accept, then uses their own password and PIN', async () => {
    await send('post', '/admin/users', NEW_CUSTOMER);
    const code = await lastCode(NEW_CUSTOMER.email);
    expect((await logIn(app, NEW_CUSTOMER.email, 'password12')).status).toBe(401);

    const accept = (body: object) => request(app).post('/auth/accept-invite').send({ email: NEW_CUSTOMER.email, password: 'mypass123', pin: '285714', ...body });
    expect((await accept({ code: code === '000000' ? '111111' : '000000' })).status).toBe(400);
    expect((await accept({ code })).body).toEqual({ accepted: true });
    expect((await accept({ code })).status).toBe(400); // used once only

    const login = await logIn(app, NEW_CUSTOMER.email, 'mypass123');
    expect(login.status).toBe(200);
    const userId = login.body.user.id;
    expect(await lastEvent(userId, 'INVITE_ACCEPTED')).toBeDefined();
  });

  it('can resend the invite code, and a sign-up code is not accepted as an invite', async () => {
    await send('post', '/admin/users', NEW_CUSTOMER);
    await pool.query("UPDATE email_otps SET last_sent_at = now() - interval '2 minutes' WHERE purpose = 'INVITE'");
    await request(app).post('/auth/resend-code').send({ email: NEW_CUSTOMER.email, invite: true });
    const code = await lastCode(NEW_CUSTOMER.email);
    expect((await request(app).post('/auth/verify-email').send({ email: NEW_CUSTOMER.email, code })).status).toBe(400);
    const res = await request(app).post('/auth/accept-invite').send({ email: NEW_CUSTOMER.email, code, password: 'mypass123', pin: '285714' });
    expect(res.status).toBe(200);
  });
});

describe('Edit user', () => {
  it('needs a reason and at least one change', async () => {
    expect((await send('patch', `/admin/users/${zak.id}`, { fullName: 'Zak D' })).status).toBe(400);
    expect((await send('patch', `/admin/users/${zak.id}`, { reason: REASON })).status).toBe(400);
    expect((await send('patch', `/admin/users/${zak.id}`, { fullName: 'Zakarya Dawman', reason: REASON })).status).toBe(400);
  });

  it('changes name and phone and logs old and new values masked', async () => {
    const res = await send('patch', `/admin/users/${zak.id}`, { fullName: 'Zakarya D', phone: '012 777 0000', reason: REASON });
    expect(res.status).toBe(204);
    const event = await lastEvent(zak.id, 'ADMIN_EDIT_USER');
    expect(event).toMatchObject({ reason: REASON, actor_id: adminId });
    expect(event.details.changes).toEqual([
      { field: 'name', from: 'Zakarya Dawman', to: 'Zakarya D' },
      { field: 'phone', from: '+60 12-*** 6789', to: '+60 12-*** 0000' },
    ]);
    expect((await request(app).get('/me').set('Authorization', `Bearer ${zak.token}`)).status).toBe(200); // no new email: still signed in
  });

  it('a new email ends every session and must be verified with a code sent to it', async () => {
    expect((await send('patch', `/admin/users/${zak.id}`, { email: 'zak.new@email.com', reason: REASON })).status).toBe(204);
    expect((await request(app).get('/me').set('Authorization', `Bearer ${zak.token}`)).status).toBe(401);
    expect((await logIn(app, 'zak.new@email.com', 'password12')).status).toBe(403);
    const code = await lastCode('zak.new@email.com');
    expect((await request(app).post('/auth/verify-email').send({ email: 'zak.new@email.com', code })).status).toBe(200);
    expect((await logIn(app, 'zak.new@email.com', 'password12')).status).toBe(200);
  });

  it('refuses an email or phone another account uses, with one message', async () => {
    await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
    const byEmail = await send('patch', `/admin/users/${zak.id}`, { email: 'ahmad@email.com', reason: REASON });
    const byPhone = await send('patch', `/admin/users/${zak.id}`, { phone: '0123454521', reason: REASON });
    expect([byEmail.status, byPhone.status]).toEqual([409, 409]);
    expect(byEmail.body).toEqual(byPhone.body);
  });
});

describe('Deactivate user', () => {
  it('needs a reason and a RM 0 balance', async () => {
    expect((await send('post', `/admin/users/${zak.id}/deactivate`, {})).status).toBe(400);
    const res = await send('post', `/admin/users/${zak.id}/deactivate`, { reason: REASON });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('balance_not_zero');
  });

  it('ends sessions, blocks sign-in, lookup and payments, and keeps the records', async () => {
    const ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
    await send('post', '/transfers', { recipientPhone: '0123456789', amountSen: 1_000, note: '', pin: '482913' }, ahmad.token);
    const held = await send('post', '/transfers', { recipientPhone: '0123456789', amountSen: 80_000, note: '', pin: '482913' }, ahmad.token);
    await setBalance(zak.id, 0);

    expect((await send('post', `/admin/users/${zak.id}/deactivate`, { reason: REASON })).status).toBe(204);
    expect((await request(app).get('/me').set('Authorization', `Bearer ${zak.token}`)).status).toBe(401);
    const login = await logIn(app, 'zak@email.com', 'password12');
    expect(login.status).toBe(401);
    expect(login.body.message).toBe('Email or password is wrong');
    expect((await request(app).get('/users/lookup?phone=0123456789').set('Authorization', `Bearer ${ahmad.token}`)).status).toBe(404);
    expect((await send('post', '/transfers', { recipientPhone: '0123456789', amountSen: 1_000, note: '', pin: '482913' }, ahmad.token)).status).toBe(404);

    const { rows } = await pool.query('SELECT status FROM transactions WHERE id = $1', [held.body.id]);
    expect(rows[0].status).toBe('CANCELLED');
    expect((await pool.query('SELECT count(*)::int AS n FROM transactions WHERE receiver_id = $1', [zak.id])).rows[0].n).toBe(2);
    expect((await lastEvent(zak.id, 'ADMIN_DEACTIVATE')).actor_id).toBe(adminId);
  });

  it('shows as deactivated and refuses further changes', async () => {
    await setBalance(zak.id, 0);
    await send('post', `/admin/users/${zak.id}/deactivate`, { reason: REASON });
    const list = await request(app).get('/admin/users').set('Authorization', `Bearer ${admin}`);
    expect(list.body.users[0]).toMatchObject({ fullName: 'Zakarya Dawman', status: 'deactivated' });
    expect((await request(app).get(`/admin/users/${zak.id}`).set('Authorization', `Bearer ${admin}`)).body.status).toBe('deactivated');
    for (const res of [
      await send('post', `/admin/users/${zak.id}/deactivate`, { reason: REASON }),
      await send('patch', `/admin/users/${zak.id}`, { fullName: 'Zak D', reason: REASON }),
      await send('post', `/admin/users/${zak.id}/freeze`, { reason: REASON }),
    ]) {
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('deactivated');
    }
  });
});
