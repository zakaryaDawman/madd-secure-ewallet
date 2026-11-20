import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { signUp } from './helpers';

type User = { id: number; token: string };

let app: Express;
let zak: User;
let ahmad: User;
let sara: User;

/** Adds a transaction straight into the database, minutes ago, and returns its id. */
async function addTransaction(from: User, to: User, amountSen: number, status: string, minutesAgo: number): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO transactions (sender_id, receiver_id, amount_sen, note, status, created_at, completed_at)
     VALUES ($1, $2, $3, 'Test', $4, now() - make_interval(mins => $5),
             CASE WHEN $4 = 'COMPLETED' THEN now() - make_interval(mins => $5) END)
     RETURNING id`,
    [from.id, to.id, amountSen, status, minutesAgo],
  );
  return rows[0].id;
}

/** GET /transactions as a user, with an optional filter. */
function list(user: User, filter?: string) {
  return request(app)
    .get('/transactions')
    .query(filter ? { filter } : {})
    .set('Authorization', `Bearer ${user.token}`);
}

/** GET /transactions/:id as a user. */
function detail(user: User, id: number | string) {
  return request(app).get(`/transactions/${id}`).set('Authorization', `Bearer ${user.token}`);
}

/** Just the amounts of a list response, to compare order easily. */
function amounts(res: request.Response): number[] {
  return res.body.transactions.map((t: { amountSen: number }) => t.amountSen);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
  sara = await signUp(app, 'Sara Lim', 'sara@email.com', '0123451111');
});
afterAll(() => pool.end());

describe('GET /transactions', () => {
  beforeEach(async () => {
    await addTransaction(zak, ahmad, 100, 'COMPLETED', 30); // out
    await addTransaction(ahmad, zak, 200, 'COMPLETED', 20); // in
    await addTransaction(zak, ahmad, 300, 'PENDING', 10); // held
    await addTransaction(ahmad, zak, 400, 'PENDING', 5); // Ahmad's held transfer: not Zak's yet
  });

  it('lists all of the user\'s transactions, newest first', async () => {
    const res = await list(zak);
    expect(res.status).toBe(200);
    expect(amounts(res)).toEqual([300, 200, 100]);
    expect(res.body.transactions[0]).toMatchObject({ direction: 'out', otherName: 'Ahmad Ali', status: 'PENDING' });
  });

  it('filters In, Out and Held', async () => {
    expect(amounts(await list(zak, 'in'))).toEqual([200]);
    expect(amounts(await list(zak, 'out'))).toEqual([300, 100]);
    expect(amounts(await list(zak, 'held'))).toEqual([300]);
  });

  it('rejects an unknown filter', async () => {
    expect((await list(zak, 'everything')).status).toBe(400);
  });

  it('needs a valid session', async () => {
    expect((await request(app).get('/transactions')).status).toBe(401);
  });
});

describe('GET /transactions/:id', () => {
  it('shows the details to the sender and the receiver', async () => {
    const id = await addTransaction(zak, ahmad, 2_500, 'COMPLETED', 1);
    const asSender = await detail(zak, id);
    expect(asSender.status).toBe(200);
    expect(asSender.body).toMatchObject({ direction: 'out', amountSen: 2_500, otherName: 'Ahmad Ali', otherPhone: '+60 12-*** 4521' });
    expect(asSender.body.reference).toMatch(/^MD-\d{8}-\d{4}$/);
    expect((await detail(ahmad, id)).body).toMatchObject({ direction: 'in', otherName: 'Zakarya Dawman' });
  });

  it('gives 404 for a missing or invalid id', async () => {
    expect((await detail(zak, 999_999)).status).toBe(404);
    expect((await detail(zak, 'abc')).status).toBe(404);
  });
});

describe('privacy: a user only ever sees their own transactions', () => {
  it('hides a transfer between two other people, in the list and by id', async () => {
    const id = await addTransaction(zak, ahmad, 5_000, 'COMPLETED', 1);

    expect((await list(sara)).body.transactions).toEqual([]);
    const res = await detail(sara, id);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not_found', message: "We couldn't find this transaction." });
  });

  it('hides a held transfer from the person it is going to', async () => {
    const id = await addTransaction(zak, ahmad, 5_000, 'PENDING', 1);
    expect((await list(ahmad)).body.transactions).toEqual([]);
    expect((await detail(ahmad, id)).status).toBe(404);
  });
});

describe('GET /transactions/:id: Sent from (design 26)', () => {
  it('names the phone a transfer was sent from, and marks it as this phone', async () => {
    const sent = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${zak.token}`)
      .send({ recipientPhone: '012 345 4521', amountSen: 1_000, note: '', pin: '482913' });
    const res = await request(app).get(`/transactions/${sent.body.id}`).set('Authorization', `Bearer ${zak.token}`);
    expect(res.body.sentFrom).toEqual({ name: 'Test Phone', thisDevice: true });
  });
});
