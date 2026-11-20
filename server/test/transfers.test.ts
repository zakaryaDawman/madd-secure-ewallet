import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { makeReference } from '../src/services/transfers';
import { clearTables, prepareTestDatabase } from './db';
import { signUp } from './helpers';

let app: Express;
let zak: { id: number; token: string };
let ahmad: { id: number; token: string };

/** Sends a transfer as Zakarya to Ahmad; each test can change any field. */
function send(overrides: Record<string, unknown> = {}, token = zak.token) {
  return request(app)
    .post('/transfers')
    .set('Authorization', `Bearer ${token}`)
    .send({ recipientPhone: '012 345 4521', amountSen: 12_000, note: 'Dinner', pin: '482913', ...overrides });
}

/** Reads a user's balance straight from the database. */
async function balanceOf(userId: number): Promise<number> {
  const { rows } = await pool.query('SELECT balance_sen FROM wallets WHERE user_id = $1', [userId]);
  return Number(rows[0].balance_sen);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
});
afterAll(() => pool.end());

describe('POST /transfers: success', () => {
  it('moves the money and returns a receipt', async () => {
    const res = await send();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ amountSen: 12_000, note: 'Dinner', recipientName: 'Ahm*** Ali', newBalanceSen: 88_000 });
    expect(res.body.reference).toMatch(/^MD-\d{8}-\d{4}$/);
    expect(await balanceOf(zak.id)).toBe(88_000);
    expect(await balanceOf(ahmad.id)).toBe(112_000);
  });

  it('records one COMPLETED transaction', async () => {
    await send();
    const { rows } = await pool.query('SELECT sender_id, receiver_id, amount_sen, status FROM transactions');
    expect(rows).toEqual([{ sender_id: zak.id, receiver_id: ahmad.id, amount_sen: '12000', status: 'COMPLETED' }]);
  });

  it('can send the whole balance', async () => {
    // RM 400 first, so RM 600 is within 3 x the usual transfer and rule R1 does not hold it
    expect((await send({ amountSen: 40_000 })).status).toBe(201);
    expect((await send({ amountSen: 60_000 })).status).toBe(201);
    expect(await balanceOf(zak.id)).toBe(0);
  });
});

describe('POST /transfers: refused', () => {
  it('refuses a wrong PIN and moves nothing', async () => {
    const res = await send({ pin: '000001' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('wrong_pin');
    expect(await balanceOf(zak.id)).toBe(100_000);
  });

  it('refuses more than the balance', async () => {
    const res = await send({ amountSen: 100_001 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('insufficient_funds');
    expect(await balanceOf(zak.id)).toBe(100_000);
  });

  it('refuses sending to yourself', async () => {
    const res = await send({ recipientPhone: '0123456789' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('self');
  });

  it('refuses an unknown recipient', async () => {
    expect((await send({ recipientPhone: '0198881234' })).status).toBe(404);
  });

  it.each([
    ['zero', 0],
    ['negative', -500],
    ['decimal sen', 10.5],
    ['below RM 1', 99],
    ['above RM 50,000', 5_000_001],
    ['text', '100'],
  ])('rejects a %s amount', async (_name, amountSen) => {
    const res = await send({ amountSen });
    expect(res.status).toBe(400);
    expect(res.body.fields.amountSen).toEqual(expect.any(String));
  });

  it('says "largest transfer" for a huge amount', async () => {
    const res = await send({ amountSen: 1e20 });
    expect(res.body.fields.amountSen).toBe('The largest transfer is RM 50,000.00');
  });

  it('rejects a note over 50 characters', async () => {
    expect((await send({ note: 'x'.repeat(51) })).status).toBe(400);
  });

  it('needs a valid session', async () => {
    const res = await request(app).post('/transfers').send({ recipientPhone: '0123454521', amountSen: 100, pin: '482913' });
    expect(res.status).toBe(401);
  });
});

describe('POST /transfers: safe under pressure', () => {
  it('lets only one of two simultaneous transfers through when both cannot fit', async () => {
    await send({ amountSen: 30_000 }); // balance RM 700; amounts stay under RM 500 so rule R1 does not hold them
    const [a, b] = await Promise.all([send({ amountSen: 40_000 }), send({ amountSen: 40_000 })]);
    expect([a.status, b.status].sort()).toEqual([201, 400]);
    expect(await balanceOf(zak.id)).toBe(30_000);
    expect(await balanceOf(ahmad.id)).toBe(170_000);
  });

  it('never loses or creates money when two people pay each other at once', async () => {
    await Promise.all([
      send({ amountSen: 30_000 }),
      send({ recipientPhone: '0123456789', amountSen: 50_000 }, ahmad.token),
      send({ amountSen: 10_000 }),
    ]);
    const total = (await balanceOf(zak.id)) + (await balanceOf(ahmad.id));
    expect(total).toBe(200_000);
  });
});

describe('makeReference', () => {
  it('builds MD-date-number', () => {
    expect(makeReference(42, new Date('2026-11-20T10:00:00Z'))).toBe('MD-20261120-0042');
  });
});
