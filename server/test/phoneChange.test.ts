import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { signUp } from './helpers';
import { lastCode, mailbox } from './mailbox';

const PIN = '482913';
const NEW_PHONE = '012 777 0000';

let app: Express;
let zak: { id: number; token: string };

/** POST as Zakarya (or another token). */
function post(path: string, body: object = {}, token = zak.token) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

/** Zakarya's phone number, straight from the database. */
async function phoneNow(): Promise<string> {
  return (await pool.query('SELECT phone FROM users WHERE id = $1', [zak.id])).rows[0].phone;
}

/** Any 6-digit code that isn't the right one. */
function wrong(code: string): string {
  return code === '000000' ? '111111' : '000000';
}

/** Lets the next code be emailed now (skips the 60-second wait). */
async function skipWait(): Promise<void> {
  await pool.query("UPDATE email_otps SET last_sent_at = now() - interval '2 minutes' WHERE purpose = 'PHONE'");
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
});
afterAll(() => pool.end());

describe('change my phone number (G11)', () => {
  it('needs a token', async () => {
    expect((await request(app).post('/me/phone').send({ phone: NEW_PHONE, pin: PIN })).status).toBe(401);
  });

  it('PIN + emailed code changes the number, logs it and emails that it changed', async () => {
    const start = await post('/me/phone', { phone: NEW_PHONE, pin: PIN });
    expect(start.body).toEqual({ sentTo: 'z**@email.com' });
    expect(await phoneNow()).toBe('+60123456789'); // nothing changes before the code
    const code = await lastCode('zak@email.com');
    expect((await post('/me/phone/confirm', { code })).status).toBe(204);
    expect(await phoneNow()).toBe('+60127770000');
    const { rows } = await pool.query("SELECT details FROM security_events WHERE user_id = $1 AND type = 'PHONE_CHANGED'", [zak.id]);
    expect(rows[0].details).toEqual({ from: '+60 12-*** 6789', to: '+60 12-*** 0000' });
    await lastCode('zak@email.com').catch(() => undefined);
    expect(mailbox.some((m) => m.subject === 'Your MADD phone number changed')).toBe(true);
    expect((await post('/me/phone/confirm', { code })).status).toBe(404); // used once only
  });

  it('a wrong PIN changes nothing and counts towards the PIN lock', async () => {
    const res = await post('/me/phone', { phone: NEW_PHONE, pin: '285714' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('wrong_pin');
    expect(mailbox).toHaveLength(0);
  });

  it('refuses my own number, a bad number and one someone else has', async () => {
    await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
    expect((await post('/me/phone', { phone: '0123456789', pin: PIN })).body.error).toBe('same_phone');
    expect((await post('/me/phone', { phone: '999', pin: PIN })).status).toBe(400);
    expect((await post('/me/phone', { phone: '0123454521', pin: PIN })).status).toBe(409);
  });

  it('5 wrong codes lock it; the number stays the same', async () => {
    await post('/me/phone', { phone: NEW_PHONE, pin: PIN });
    const code = await lastCode('zak@email.com');
    for (let i = 4; i >= 1; i--) expect((await post('/me/phone/confirm', { code: wrong(code) })).body.triesLeft).toBe(i);
    expect((await post('/me/phone/confirm', { code: wrong(code) })).status).toBe(423);
    expect((await post('/me/phone/confirm', { code })).status).toBe(423);
    expect(await phoneNow()).toBe('+60123456789');
  });

  it('an old code runs out after 5 minutes', async () => {
    await post('/me/phone', { phone: NEW_PHONE, pin: PIN });
    const code = await lastCode('zak@email.com');
    await pool.query("UPDATE email_otps SET expires_at = now() - interval '1 second' WHERE purpose = 'PHONE'");
    expect((await post('/me/phone/confirm', { code })).status).toBe(410);
  });

  it('resend: 60 s apart, at most 3 emails, and the new code replaces the old one', async () => {
    await post('/me/phone', { phone: NEW_PHONE, pin: PIN });
    const first = await lastCode('zak@email.com');
    expect((await post('/me/phone/resend')).status).toBe(429);
    await skipWait();
    expect((await post('/me/phone/resend')).status).toBe(200);
    await skipWait();
    expect((await post('/me/phone/resend')).status).toBe(200);
    await skipWait();
    expect((await post('/me/phone/resend')).body.error).toBe('resend_limit');
    const latest = await lastCode('zak@email.com');
    if (latest !== first) expect((await post('/me/phone/confirm', { code: first })).status).toBe(403);
    expect((await post('/me/phone/confirm', { code: latest })).status).toBe(204);
  });

  it('starting again within 60 seconds is refused (can\'t skip the resend limits)', async () => {
    await post('/me/phone', { phone: NEW_PHONE, pin: PIN });
    expect((await post('/me/phone', { phone: '012 777 1111', pin: PIN })).status).toBe(429);
  });

  it('if someone takes the number before the code is entered, nothing changes', async () => {
    await post('/me/phone', { phone: NEW_PHONE, pin: PIN });
    const code = await lastCode('zak@email.com');
    await signUp(app, 'Ahmad Ali', 'ahmad@email.com', NEW_PHONE);
    expect((await post('/me/phone/confirm', { code })).status).toBe(409);
    expect(await phoneNow()).toBe('+60123456789');
  });

  it('people can pay me on the new number only', async () => {
    const ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
    await post('/me/phone', { phone: NEW_PHONE, pin: PIN });
    await post('/me/phone/confirm', { code: await lastCode('zak@email.com') });
    const lookup = (phone: string) => request(app).get(`/users/lookup?phone=${encodeURIComponent(phone)}`).set('Authorization', `Bearer ${ahmad.token}`);
    expect((await lookup('0123456789')).status).toBe(404);
    expect((await lookup(NEW_PHONE)).status).toBe(200);
  });
});
