import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp, TEST_DEVICE } from './helpers';

const OTHER_DEVICE = '22222222-2222-4222-8222-222222222222';

let app: Express;

/** All login_attempts rows, oldest first, without ids and times. */
async function attempts() {
  const { rows } = await pool.query('SELECT email, user_id, device_id, success FROM login_attempts ORDER BY id');
  return rows;
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
});
afterAll(() => pool.end());

describe('login attempts (FR-9)', () => {
  it('records a successful and a failed login on a real account', async () => {
    const zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
    await logIn(app, 'zak@email.com', 'wrongpass1', OTHER_DEVICE);
    expect(await attempts()).toEqual([
      { email: 'zak@email.com', user_id: zak.id, device_id: TEST_DEVICE, success: true },
      { email: 'zak@email.com', user_id: zak.id, device_id: OTHER_DEVICE, success: false },
    ]);
  });

  it('records a try on an email that has no account (no user linked)', async () => {
    await logIn(app, 'nobody@email.com', 'password12');
    expect(await attempts()).toEqual([{ email: 'nobody@email.com', user_id: null, device_id: TEST_DEVICE, success: false }]);
  });

  it('refuses a login without a valid device id', async () => {
    await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
    const res = await request(app).post('/auth/login').send({ email: 'zak@email.com', password: 'password12', deviceId: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual({ deviceId: 'Missing device id' });
  });
});

describe('known devices', () => {
  it('trusts the first device and not a later one', async () => {
    const zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
    await logIn(app, 'zak@email.com', 'password12', OTHER_DEVICE);
    await logIn(app, 'zak@email.com', 'password12'); // same first phone again: still one row
    const { rows } = await pool.query('SELECT user_id, device_id, trusted FROM known_devices ORDER BY first_seen');
    expect(rows).toEqual([
      { user_id: zak.id, device_id: TEST_DEVICE, trusted: true },
      { user_id: zak.id, device_id: OTHER_DEVICE, trusted: false },
    ]);
  });

  it('does not add a device for a failed login', async () => {
    await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
    await logIn(app, 'zak@email.com', 'wrongpass1', OTHER_DEVICE);
    const { rows } = await pool.query('SELECT device_id FROM known_devices');
    expect(rows).toEqual([{ device_id: TEST_DEVICE }]);
  });

  it('puts the device id inside the signed token', async () => {
    await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
    const ok = await logIn(app, 'zak@email.com', 'password12', OTHER_DEVICE);
    expect((jwt.decode(ok.body.token) as jwt.JwtPayload).did).toBe(OTHER_DEVICE);
  });
});
