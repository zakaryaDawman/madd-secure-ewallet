import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';

const NEW_PHONE = '22222222-2222-4222-8222-222222222222';

let app: Express;
let zak: { id: number; token: string };

/** POST /me/freeze as a phone, with or without a PIN. */
function freeze(body: object, token = zak.token) {
  return request(app).post('/me/freeze').set('Authorization', `Bearer ${token}`).send(body);
}

/** Locks Zakarya's PIN with 5 wrong tries on Change PIN. */
async function lockPin(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await request(app).post('/me/pin').set('Authorization', `Bearer ${zak.token}`).send({ currentPin: '135792', newPin: '864208' });
  }
}

/** True if Zakarya's account is frozen in the database. */
async function isFrozen(): Promise<boolean> {
  const { rows } = await pool.query('SELECT frozen_at IS NOT NULL AS frozen FROM users WHERE id = $1', [zak.id]);
  return rows[0].frozen;
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
});
afterAll(() => pool.end());

describe('Freeze my account from Profile (design 30)', () => {
  it('freezes with the right PIN, logs out every phone and logs it', async () => {
    const second = (await logIn(app, 'zak@email.com', 'password12', NEW_PHONE)).body.token;
    expect((await freeze({ pin: '482913' })).status).toBe(200);
    expect(await isFrozen()).toBe(true);
    for (const token of [zak.token, second]) {
      const res = await request(app).get('/wallet').set('Authorization', `Bearer ${token}`);
      expect(res.body.error).toBe('account_frozen');
    }
    const { rows } = await pool.query("SELECT 1 FROM security_events WHERE type = 'ACCOUNT_FROZEN'");
    expect(rows).toHaveLength(1);
  });

  it('works with the PIN from a new (untrusted) phone too, e.g. when the usual phone is lost', async () => {
    const newPhone = (await logIn(app, 'zak@email.com', 'password12', NEW_PHONE)).body.token;
    expect((await freeze({ pin: '482913' }, newPhone)).status).toBe(200);
  });

  it('a wrong PIN does not freeze and is counted', async () => {
    const res = await freeze({ pin: '135792' });
    expect(res.status).toBe(403);
    expect(res.body.triesLeft).toBe(4);
    expect(await isFrozen()).toBe(false);
  });

  it('while the PIN is locked, freezing needs only the confirmation (no PIN)', async () => {
    const newPhone = (await logIn(app, 'zak@email.com', 'password12', NEW_PHONE)).body.token;
    await lockPin();
    const profile = await request(app).get('/me').set('Authorization', `Bearer ${newPhone}`);
    expect(profile.body.pinLocked).toBe(true);
    expect((await freeze({}, newPhone)).status).toBe(200);
    expect(await isFrozen()).toBe(true);
  });

  it('without a PIN, an untrusted phone is refused while the PIN is not locked', async () => {
    const newPhone = (await logIn(app, 'zak@email.com', 'password12', NEW_PHONE)).body.token;
    const res = await freeze({}, newPhone);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('pin_required');
    expect(await isFrozen()).toBe(false);
  });

  it('a frozen account cannot log in again', async () => {
    await freeze({ pin: '482913' });
    expect((await logIn(app, 'zak@email.com', 'password12')).status).toBe(423);
  });
});
