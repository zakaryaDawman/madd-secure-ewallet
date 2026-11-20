import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';

const SECOND_PHONE = '22222222-2222-4222-8222-222222222222';

let app: Express;
let zak: { id: number; token: string };
let ahmad: { id: number; token: string };

/** POST as a user (Zakarya unless another token is given). */
function post(path: string, body: object = {}, token = zak.token) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

/** Zakarya sends RM 800 with no history, so rule R1 holds it. Returns the held transfer's id. */
async function holdRM800(): Promise<number> {
  const res = await post('/transfers', { recipientPhone: '012 345 4521', amountSen: 80_000, note: '', pin: '482913' });
  expect(res.status).toBe(202);
  return res.body.id as number;
}

/** Reads a user's balance straight from the database. */
async function balanceOf(userId: number): Promise<number> {
  const { rows } = await pool.query('SELECT balance_sen FROM wallets WHERE user_id = $1', [userId]);
  return Number(rows[0].balance_sen);
}

/** The status of one transfer, straight from the database. */
async function statusOf(id: number): Promise<string> {
  const { rows } = await pool.query('SELECT status FROM transactions WHERE id = $1', [id]);
  return rows[0].status;
}

/** The kinds of security event logged so far, oldest first. */
async function loggedTypes(): Promise<string[]> {
  const { rows } = await pool.query('SELECT type FROM security_events ORDER BY id');
  return rows.map((r) => r.type);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
});
afterAll(() => pool.end());

describe('Yes, it was me (POST /transfers/:id/confirm)', () => {
  it('sends the held money with the right PIN and logs it', async () => {
    const id = await holdRM800();
    const res = await post(`/transfers/${id}/confirm`, { pin: '482913' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id, amountSen: 80_000, recipientName: 'Ahm*** Ali', newBalanceSen: 20_000 });
    expect(await statusOf(id)).toBe('COMPLETED');
    expect(await balanceOf(ahmad.id)).toBe(180_000);
    expect(await loggedTypes()).toEqual(['RULE_FIRED', 'HOLD_CONFIRMED']);
  });

  it('moves the money only once when Yes is tapped twice at the same time', async () => {
    const id = await holdRM800();
    const [a, b] = await Promise.all([post(`/transfers/${id}/confirm`, { pin: '482913' }), post(`/transfers/${id}/confirm`, { pin: '482913' })]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await balanceOf(zak.id)).toBe(20_000);
    expect(await balanceOf(ahmad.id)).toBe(180_000);
  });

  it('refuses a wrong PIN, counts it, and keeps the transfer waiting', async () => {
    const id = await holdRM800();
    const res = await post(`/transfers/${id}/confirm`, { pin: '135792' });
    expect(res.status).toBe(403);
    expect(res.body.triesLeft).toBe(4);
    expect(await statusOf(id)).toBe('PENDING');
  });

  it('checks the balance again: refuses if the money is no longer there', async () => {
    const id = await holdRM800();
    await pool.query('UPDATE wallets SET balance_sen = 50000 WHERE user_id = $1', [zak.id]);
    const res = await post(`/transfers/${id}/confirm`, { pin: '482913' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('insufficient_funds');
    expect(await statusOf(id)).toBe('PENDING');
  });

  it('refuses after the 5 minutes ran out, and moves nothing', async () => {
    const id = await holdRM800();
    await pool.query("UPDATE transactions SET expires_at = now() - interval '1 second' WHERE id = $1", [id]);
    expect((await post(`/transfers/${id}/confirm`, { pin: '482913' })).status).toBe(410);
    expect(await balanceOf(zak.id)).toBe(100_000);
  });

  it("can't confirm someone else's held transfer", async () => {
    const id = await holdRM800();
    expect((await post(`/transfers/${id}/confirm`, { pin: '482913' }, ahmad.token)).status).toBe(404);
  });
});

describe('No, freeze my account (POST /transfers/:id/reject)', () => {
  it('cancels the transfer, moves no money, freezes the account and logs it', async () => {
    const id = await holdRM800();
    const res = await post(`/transfers/${id}/reject`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ frozen: true, cancelledAmountSen: 80_000 });
    expect(await statusOf(id)).toBe('CANCELLED');
    expect(await balanceOf(zak.id)).toBe(100_000);
    const { rows } = await pool.query('SELECT frozen_at IS NOT NULL AS frozen FROM users WHERE id = $1', [zak.id]);
    expect(rows[0].frozen).toBe(true);
    expect(await loggedTypes()).toEqual(['RULE_FIRED', 'HOLD_REJECTED', 'ACCOUNT_FROZEN']);
  });

  it('logs out every phone: old tokens get account_frozen', async () => {
    const second = await logIn(app, 'zak@email.com', 'password12', SECOND_PHONE);
    const id = await holdRM800();
    await post(`/transfers/${id}/reject`);
    for (const token of [zak.token, second.body.token]) {
      const res = await request(app).get('/wallet').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('account_frozen');
    }
  });

  it('refuses to log in again with the right password (423), but a wrong password still gets the usual message', async () => {
    await post(`/transfers/${await holdRM800()}/reject`);
    const right = await logIn(app, 'zak@email.com', 'password12');
    expect(right.status).toBe(423);
    expect(right.body.error).toBe('account_frozen');
    expect(right.body.token).toBeUndefined();
    const wrong = await logIn(app, 'zak@email.com', 'wrongpass99');
    expect(wrong.status).toBe(401);
    expect(wrong.body.error).toBe('invalid_login');
  });

  it("can't say No after Yes", async () => {
    const id = await holdRM800();
    await post(`/transfers/${id}/confirm`, { pin: '482913' });
    expect((await post(`/transfers/${id}/reject`)).status).toBe(409);
    expect(await statusOf(id)).toBe('COMPLETED');
  });

  it("can't say Yes after No: the account is frozen and the token no longer works", async () => {
    const id = await holdRM800();
    await post(`/transfers/${id}/reject`);
    expect((await post(`/transfers/${id}/confirm`, { pin: '482913' })).status).toBe(401);
    expect(await balanceOf(zak.id)).toBe(100_000);
  });

  it("can't reject someone else's held transfer", async () => {
    const id = await holdRM800();
    expect((await post(`/transfers/${id}/reject`, {}, ahmad.token)).status).toBe(404);
    expect(await statusOf(id)).toBe('PENDING');
  });
});

describe('PIN lock is in the security log', () => {
  it('logs PIN_LOCKED at the 5th wrong PIN', async () => {
    const id = await holdRM800();
    for (let i = 0; i < 5; i++) await post(`/transfers/${id}/confirm`, { pin: '135792' });
    expect(await loggedTypes()).toEqual(['RULE_FIRED', 'PIN_LOCKED']);
  });
});
