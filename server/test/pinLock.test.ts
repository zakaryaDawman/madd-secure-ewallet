import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { signUp } from './helpers';

const RIGHT_PIN = '482913';
const WRONG_PIN = '135792';

let app: Express;
let zak: { id: number; token: string };

/** Sends RM 10 from Zakarya to Ahmad with this PIN. */
function send(pin: string) {
  return request(app)
    .post('/transfers')
    .set('Authorization', `Bearer ${zak.token}`)
    .send({ recipientPhone: '012 345 4521', amountSen: 1_000, note: '', pin });
}

/** Sends `count` transfers with a wrong PIN, one after another. Returns the last answer. */
async function sendWrong(count: number) {
  let res = await send(WRONG_PIN);
  for (let i = 1; i < count; i++) res = await send(WRONG_PIN);
  return res;
}

/** Moves every saved PIN attempt `minutes` into the past, as if that much time went by. */
async function waitMinutes(minutes: number): Promise<void> {
  await pool.query(`UPDATE pin_attempts SET created_at = created_at - make_interval(mins => $1)`, [minutes]);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
});
afterAll(() => pool.end());

describe('wrong PIN lock on transfers', () => {
  it('says how many tries are left (design 31, state 1)', async () => {
    const res = await sendWrong(3);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: 'wrong_pin', triesLeft: 2, message: 'Wrong PIN. 2 tries left before transfers are locked.' });
  });

  it('locks transfers at the 5th wrong PIN (state 2)', async () => {
    const res = await sendWrong(5);
    expect(res.status).toBe(423);
    expect(res.body.error).toBe('pin_locked');
    const minutesLeft = (new Date(res.body.unlocksAt).getTime() - Date.now()) / 60_000;
    expect(minutesLeft).toBeGreaterThan(14.9);
    expect(minutesLeft).toBeLessThanOrEqual(15);
  });

  it('refuses even the right PIN while locked, moves no money, and does not count those tries', async () => {
    await sendWrong(5);
    const res = await send(RIGHT_PIN);
    expect(res.status).toBe(423);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM transactions');
    expect(rows[0].n).toBe(0);
    const attempts = await pool.query('SELECT count(*)::int AS n FROM pin_attempts');
    expect(attempts.rows[0].n).toBe(5);
  });

  it('is still locked after 14 minutes and unlocks after 15', async () => {
    await sendWrong(5);
    await waitMinutes(14);
    expect((await send(RIGHT_PIN)).status).toBe(423);
    await waitMinutes(1);
    expect((await send(RIGHT_PIN)).status).toBe(201);
  });

  it('a right PIN resets the count', async () => {
    await sendWrong(4);
    expect((await send(RIGHT_PIN)).status).toBe(201);
    expect((await send(WRONG_PIN)).body.triesLeft).toBe(4);
  });

  it('still shows balance and history while locked', async () => {
    await sendWrong(5);
    const auth = { Authorization: `Bearer ${zak.token}` };
    expect((await request(app).get('/wallet').set(auth)).status).toBe(200);
    expect((await request(app).get('/transactions').set(auth)).status).toBe(200);
  });
});

describe('wrong PIN lock on Change PIN', () => {
  /** Tries to change the PIN with this current PIN. */
  function changePin(currentPin: string) {
    return request(app).post('/me/pin').set('Authorization', `Bearer ${zak.token}`).send({ currentPin, newPin: '864208' });
  }

  it('shares the count with transfers', async () => {
    await sendWrong(4);
    expect((await changePin(WRONG_PIN)).status).toBe(423);
    expect((await send(RIGHT_PIN)).status).toBe(423);
  });

  it('cannot be used to keep guessing while locked', async () => {
    await sendWrong(5);
    expect((await changePin(RIGHT_PIN)).status).toBe(423);
  });
});
