import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp, TEST_DEVICE } from './helpers';

const NEW_PHONE = '22222222-2222-4222-8222-222222222222';
const GENERAL_REASON = 'This transfer needs approval from your usual phone.';

let app: Express;
let usual: string; // Zakarya's token on his first (trusted) phone
let newPhone: string; // Zakarya's token on a phone he never used before

/** POST as a phone. */
function post(path: string, token: string, body: object = {}) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

/** GET as a phone. */
function get(path: string, token: string) {
  return request(app).get(path).set('Authorization', `Bearer ${token}`);
}

/** Sends RM 10 to Ahmad (small, so only rule R3 can hold it). */
function sendRM10(token: string) {
  return post('/transfers', token, { recipientPhone: '012 345 4521', amountSen: 1_000, note: '', pin: '482913' });
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  usual = (await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789')).token;
  await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
  newPhone = (await logIn(app, 'zak@email.com', 'password12', NEW_PHONE)).body.token;
});
afterAll(() => pool.end());

describe('R3 at login', () => {
  it('lets the new phone in, says it is not trusted, and logs R3', async () => {
    const res = await logIn(app, 'zak@email.com', 'password12', NEW_PHONE);
    expect(res.status).toBe(200);
    expect(res.body.deviceTrusted).toBe(false);
    const { rows } = await pool.query("SELECT rule FROM security_events WHERE type = 'RULE_FIRED'");
    expect(rows.map((r) => r.rule)).toEqual(['R3', 'R3']);
  });

  it('the usual phone is trusted and logs nothing', async () => {
    const res = await logIn(app, 'zak@email.com', 'password12', TEST_DEVICE);
    expect(res.body.deviceTrusted).toBe(true);
  });
});

describe('transfers from a new phone', () => {
  it('are held by R3, and the new phone only sees a general message', async () => {
    const res = await sendRM10(newPhone);
    expect(res.status).toBe(202);
    const seenByNewPhone = await get(`/transactions/${res.body.id}`, newPhone);
    expect(seenByNewPhone.body.hold).toMatchObject({ reasons: [GENERAL_REASON], canDecide: false });
  });

  it('the usual phone sees the real reason and can decide', async () => {
    const { body } = await sendRM10(newPhone);
    const seenByUsual = await get(`/transactions/${body.id}`, usual);
    expect(seenByUsual.body.hold).toMatchObject({ reasons: ['This phone is not one of your trusted devices.'], canDecide: true });
  });

  it('the new phone cannot approve or reject its own transfer', async () => {
    const { body } = await sendRM10(newPhone);
    expect((await post(`/transfers/${body.id}/confirm`, newPhone, { pin: '482913' })).status).toBe(403);
    expect((await post(`/transfers/${body.id}/reject`, newPhone)).status).toBe(403);
  });

  it('the usual phone approves it: the money moves once', async () => {
    const { body } = await sendRM10(newPhone);
    const res = await post(`/transfers/${body.id}/confirm`, usual, { pin: '482913' });
    expect(res.status).toBe(201);
    expect(res.body.newBalanceSen).toBe(99_000);
  });

  it('transfers from the usual phone are not held', async () => {
    expect((await sendRM10(usual)).status).toBe(201);
  });
});

describe('the new device alert and Trust this device', () => {
  it('only the usual phone is told about the waiting phone', async () => {
    expect((await get('/me/devices/pending', usual)).body.device).toMatchObject({ deviceId: NEW_PHONE, trusted: false });
    expect((await get('/me/devices/pending', newPhone)).body.device).toBeNull();
  });

  it('the usual phone trusts it with the PIN; then its transfers are not held', async () => {
    expect((await post(`/me/devices/${NEW_PHONE}/trust`, usual, { pin: '482913' })).status).toBe(204);
    expect((await sendRM10(newPhone)).status).toBe(201);
    expect((await get('/me/devices/pending', usual)).body.device).toBeNull();
    const { rows } = await pool.query("SELECT 1 FROM security_events WHERE type = 'DEVICE_TRUSTED'");
    expect(rows).toHaveLength(1);
  });

  it('trusting does not release a transfer that is already held', async () => {
    const { body } = await sendRM10(newPhone);
    await post(`/me/devices/${NEW_PHONE}/trust`, usual, { pin: '482913' });
    expect((await get(`/transactions/${body.id}`, usual)).body.status).toBe('PENDING');
  });

  it('refuses a wrong PIN and counts it', async () => {
    const res = await post(`/me/devices/${NEW_PHONE}/trust`, usual, { pin: '135792' });
    expect(res.status).toBe(403);
    expect(res.body.triesLeft).toBe(4);
  });

  it('the new phone cannot trust itself', async () => {
    expect((await post(`/me/devices/${NEW_PHONE}/trust`, newPhone, { pin: '482913' })).status).toBe(403);
  });

  it('"No, freeze my account" on the alert freezes and logs out both phones', async () => {
    expect((await post(`/me/devices/${NEW_PHONE}/reject`, usual)).status).toBe(200);
    for (const token of [usual, newPhone]) {
      expect((await get('/wallet', token)).body.error).toBe('account_frozen');
    }
  });

  it('the new phone cannot freeze the account through the alert', async () => {
    expect((await post(`/me/devices/${NEW_PHONE}/reject`, newPhone)).status).toBe(403);
    expect((await get('/wallet', usual)).status).toBe(200);
  });
});
