import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { PushAlert, pushesSettled, setPushSender } from '../src/services/push';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';

const NEW_PHONE = '22222222-2222-4222-8222-222222222222';
const USUAL_TOKEN = 'usual-phone-firebase-token';
const NEW_TOKEN = 'new-phone-firebase-token';

let app: Express;
let zak: { id: number; token: string };
let sent: { tokens: string[]; alert: PushAlert }[];

/** POST as a user. */
function post(path: string, body: object, token = zak.token) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

/** Zakarya sends money to Ahmad. */
function send(amountSen: number, token = zak.token) {
  return post('/transfers', { recipientPhone: '012 345 4521', amountSen, note: '', pin: '482913' }, token);
}

/** Waits for the background pushes, then returns what the fake Firebase received. */
async function pushes() {
  await pushesSettled();
  return sent;
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  sent = [];
  setPushSender(async (tokens, alert) => {
    sent.push({ tokens, alert });
    return true;
  });
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
  await post('/me/push-token', { token: USUAL_TOKEN });
});
afterAll(async () => {
  await pushesSettled();
  await pool.end();
});

describe('POST /me/push-token', () => {
  it('saves the token for the phone in the session', async () => {
    const { rows } = await pool.query('SELECT push_token FROM known_devices WHERE user_id = $1', [zak.id]);
    expect(rows).toEqual([{ push_token: USUAL_TOKEN }]);
  });

  it('refuses an empty token', async () => {
    expect((await post('/me/push-token', { token: '' })).status).toBe(400);
  });
});

describe('push alerts go to trusted phones only', () => {
  it('a held transfer pushes "Was this you?" to the usual phone', async () => {
    await send(80_000);
    expect(await pushes()).toEqual([
      { tokens: [USUAL_TOKEN], alert: { kind: 'TRANSFER_HELD', title: 'Was this you?', body: 'RM 800.00 transfer is waiting for you' } },
    ]);
  });

  it('a new phone signing in pushes to the usual phone, never to the new phone', async () => {
    const newPhone = (await logIn(app, 'zak@email.com', 'password12', NEW_PHONE)).body.token;
    await post('/me/push-token', { token: NEW_TOKEN }, newPhone);
    await send(1_000, newPhone); // held by R3
    const all = await pushes();
    expect(all.map((p) => p.alert.kind)).toEqual(['NEW_DEVICE', 'TRANSFER_HELD']);
    expect(all.every((p) => p.tokens.length === 1 && p.tokens[0] === USUAL_TOKEN)).toBe(true);
    expect(all[0].alert.body).toBe('New login from Test Phone. Was this you?');
  });

  it('5 wrong passwords push the sign-in lock', async () => {
    for (let i = 0; i < 5; i++) await logIn(app, 'zak@email.com', 'wrongpass99');
    expect((await pushes()).map((p) => p.alert.kind)).toEqual(['LOGIN_LOCKED']);
  });

  it('a normal transfer sends no push', async () => {
    await send(1_000);
    expect(await pushes()).toEqual([]);
  });
});

describe('push never gets in the way', () => {
  it('a failing Firebase does not stop the transfer from being held', async () => {
    setPushSender(async () => {
      throw new Error('Firebase is down');
    });
    expect((await send(80_000)).status).toBe(202);
    await pushesSettled();
    const { rows } = await pool.query('SELECT ok FROM push_log');
    expect(rows).toEqual([{ ok: false }]);
  });
});

describe('push_log measures the delay', () => {
  it('records each push with the time from the event to sending', async () => {
    await send(80_000);
    await pushesSettled();
    const { rows } = await pool.query(
      'SELECT kind, phones, ok, EXTRACT(EPOCH FROM sent_at - event_at) * 1000 AS ms FROM push_log',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'TRANSFER_HELD', phones: 1, ok: true });
    expect(Number(rows[0].ms)).toBeGreaterThanOrEqual(0);
    expect(Number(rows[0].ms)).toBeLessThan(5000);
  });
});
