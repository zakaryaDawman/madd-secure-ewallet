import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { codeEmailsSettled } from '../src/services/emailOtp';
import { clearTables, prepareTestDatabase } from './db';
import { signUp } from './helpers';

const R1_REASON = 'RM 800 is more than 3 times your usual transfer, and above your safe limit of RM 500.';

let app: Express;
let zak: { id: number; token: string };
let ahmad: { id: number; token: string };

/** Sends money as Zakarya to Ahmad with the right PIN. */
function send(amountSen: number) {
  return request(app)
    .post('/transfers')
    .set('Authorization', `Bearer ${zak.token}`)
    .send({ recipientPhone: '012 345 4521', amountSen, note: '', pin: '482913' });
}

/** GET as a user (Zakarya unless another token is given). */
function get(path: string, token = zak.token) {
  return request(app).get(path).set('Authorization', `Bearer ${token}`);
}

/** Reads a user's balance straight from the database. */
async function balanceOf(userId: number): Promise<number> {
  const { rows } = await pool.query('SELECT balance_sen FROM wallets WHERE user_id = $1', [userId]);
  return Number(rows[0].balance_sen);
}

/** Gives Zakarya a "usual" transfer of RM 96 (two completed transfers, written straight to the database). */
async function usualTransferIsRM96(): Promise<void> {
  await pool.query(
    `INSERT INTO transactions (sender_id, receiver_id, amount_sen, status, created_at, completed_at)
     VALUES ($1, $2, 9600, 'COMPLETED', now() - interval '1 day', now() - interval '1 day'),
            ($1, $2, 9600, 'COMPLETED', now() - interval '1 day', now() - interval '1 day')`,
    [zak.id, ahmad.id],
  );
}

/** Moves a held transfer `seconds` closer to running out, as if that much time went by. */
async function waitSeconds(id: number, seconds: number): Promise<void> {
  await pool.query('UPDATE transactions SET expires_at = expires_at - make_interval(secs => $2) WHERE id = $1', [id, seconds]);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
});
afterAll(() => pool.end());

describe('R1: RM 800 when the usual transfer is RM 96', () => {
  it('holds the transfer, moves no money, and shows the exact reason', async () => {
    await usualTransferIsRM96();
    const res = await send(80_000);
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ held: true, id: expect.any(Number) });
    expect(await balanceOf(zak.id)).toBe(100_000);
    expect(await balanceOf(ahmad.id)).toBe(100_000);

    const detail = await get(`/transactions/${res.body.id}`);
    expect(detail.body.status).toBe('PENDING');
    expect(detail.body.hold).toMatchObject({ reasons: [R1_REASON], thisDevice: true });
    expect(detail.body.hold.secondsLeft).toBeGreaterThan(295);
    expect(detail.body.hold.secondsLeft).toBeLessThanOrEqual(300);
  });

  it('writes one RULE_FIRED row to the security log', async () => {
    await usualTransferIsRM96();
    const res = await send(80_000);
    const { rows } = await pool.query('SELECT user_id, type, rule, transaction_id, reason FROM security_events');
    expect(rows).toEqual([{ user_id: zak.id, type: 'RULE_FIRED', rule: 'R1', transaction_id: res.body.id, reason: R1_REASON }]);
  });

  it('lets a normal transfer through', async () => {
    await usualTransferIsRM96();
    expect((await send(9_000)).status).toBe(201);
    expect((await pool.query('SELECT 1 FROM security_events')).rows).toHaveLength(0);
  });
});

describe('R2: too many transfers in 5 minutes', () => {
  it('holds the 4th transfer', async () => {
    for (let i = 0; i < 3; i++) expect((await send(1_000)).status).toBe(201);
    const res = await send(1_000);
    expect(res.status).toBe(202);
    const detail = await get(`/transactions/${res.body.id}`);
    expect(detail.body.hold.reasons).toEqual(['4 transfers in 5 minutes is faster than usual.']);
  });
});

describe('a held transfer runs out after 5 minutes (checked on read)', () => {
  it('is still waiting at 4:59 and cancelled at 5:00, with no money moved', async () => {
    const { body } = await send(80_000);
    await waitSeconds(body.id, 299);
    expect((await get(`/transactions/${body.id}`)).body.status).toBe('PENDING');

    await waitSeconds(body.id, 1);
    const detail = await get(`/transactions/${body.id}`);
    expect(detail.body.status).toBe('EXPIRED');
    expect(detail.body.hold).toBeNull();
    expect(await balanceOf(zak.id)).toBe(100_000);
    expect(await balanceOf(ahmad.id)).toBe(100_000);
  });

  it('logs HOLD_EXPIRED once, even when read many times', async () => {
    const { body } = await send(80_000);
    await waitSeconds(body.id, 300);
    await get('/transactions');
    await get(`/transactions/${body.id}`);
    await get('/wallet');
    const { rows } = await pool.query("SELECT transaction_id FROM security_events WHERE type = 'HOLD_EXPIRED'");
    expect(rows).toEqual([{ transaction_id: body.id }]);
  });

  it('is cancelled when History is opened too', async () => {
    const { body } = await send(80_000);
    await waitSeconds(body.id, 300);
    const list = await get('/transactions?filter=held');
    expect(list.body.transactions).toEqual([]);
  });
});

describe('who can see a hold', () => {
  it('the recipient does not see a held transfer', async () => {
    const { body } = await send(80_000);
    expect((await get(`/transactions/${body.id}`, ahmad.token)).status).toBe(404);
    expect((await get('/transactions', ahmad.token)).body.transactions).toEqual([]);
  });
});

describe('security_events is append-only', () => {
  // Waits for the code email too, so its OTP_SENT row is in before the checks (2 rows: RULE_FIRED + OTP_SENT).
  beforeEach(async () => {
    await send(80_000);
    await codeEmailsSettled();
  });

  it.each([
    ['UPDATE', "UPDATE security_events SET reason = 'nothing happened'"],
    ['DELETE', 'DELETE FROM security_events'],
    ['TRUNCATE', 'TRUNCATE security_events'],
  ])('refuses %s', async (_name, sql) => {
    await expect(pool.query(sql)).rejects.toThrow(/append-only/);
    expect((await pool.query('SELECT 1 FROM security_events')).rows).toHaveLength(2);
  });
});
