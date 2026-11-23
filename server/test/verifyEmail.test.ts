import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { logIn } from './helpers';
import { lastCode, mailbox } from './mailbox';
import { codeEmailsSettled } from '../src/services/emailOtp';

const EMAIL = 'new@email.com';
const GENERIC = 'The code is wrong or has run out. Check it, or ask for a new one.';

let app: Express;

/** Creates an account the way the app does (not verified yet). */
function register() {
  return request(app).post('/auth/register').send({ fullName: 'New User', email: EMAIL, phone: '012 999 1111', password: 'password12', pin: '482913' });
}

/** POST /auth/verify-email with a code. */
function verify(code: string, email = EMAIL) {
  return request(app).post('/auth/verify-email').send({ email, code });
}

/** Any 6-digit code that isn't the right one. */
function wrong(code: string): string {
  return code === '000000' ? '111111' : '000000';
}

/** Is the account's email verified, straight from the database? */
async function isVerified(): Promise<boolean> {
  const { rows } = await pool.query('SELECT email_verified_at IS NOT NULL AS v FROM users WHERE email = $1', [EMAIL]);
  return rows[0].v;
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
});
afterAll(() => pool.end());

describe('sign-up code (G4b)', () => {
  it('register emails a 6-digit code and the account starts unverified', async () => {
    expect((await register()).status).toBe(201);
    expect(await lastCode(EMAIL)).toMatch(/^\d{6}$/);
    expect(mailbox[0].subject).toBe('Your MADD sign-up code');
    expect(await isVerified()).toBe(false);
  });

  it('the right code verifies the email (once) and is logged', async () => {
    await register();
    const code = await lastCode(EMAIL);
    expect((await verify(code)).body).toEqual({ verified: true });
    expect(await isVerified()).toBe(true);
    expect((await verify(code)).status).toBe(400); // used up
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM security_events WHERE type = 'EMAIL_VERIFIED'");
    expect(rows[0].n).toBe(1);
  });

  it('a wrong, expired or unknown-email code gets the same message', async () => {
    await register();
    const code = await lastCode(EMAIL);
    const wrongReply = await verify(wrong(code));
    const unknownReply = await verify(code, 'nobody@email.com');
    await pool.query("UPDATE email_otps SET expires_at = now() - interval '1 second'");
    const expiredReply = await verify(code);
    for (const res of [wrongReply, unknownReply, expiredReply]) {
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'invalid_code', message: GENERIC });
    }
    expect(await isVerified()).toBe(false);
  });

  it('locks the code after 5 wrong tries, even for the right code', async () => {
    await register();
    const code = await lastCode(EMAIL);
    for (let i = 0; i < 5; i++) await verify(wrong(code));
    expect((await verify(code)).status).toBe(400);
    expect(await isVerified()).toBe(false);
  });
});

describe('resend and login (G4b)', () => {
  it('resend waits 60 s, then sends a new code that resets the tries', async () => {
    await register();
    const oldCode = await lastCode(EMAIL);
    for (let i = 0; i < 5; i++) await verify(wrong(oldCode));
    await request(app).post('/auth/resend-code').send({ email: EMAIL });
    await codeEmailsSettled();
    expect(mailbox).toHaveLength(1); // too soon
    await pool.query("UPDATE email_otps SET last_sent_at = now() - interval '61 seconds'");
    await request(app).post('/auth/resend-code').send({ email: EMAIL });
    const newCode = await lastCode(EMAIL);
    expect(mailbox).toHaveLength(2);
    expect((await verify(newCode)).status).toBe(200);
  });

  it('resend gives the same reply for an unknown email and sends nothing', async () => {
    const res = await request(app).post('/auth/resend-code').send({ email: 'nobody@email.com' });
    expect(res.body).toEqual({ message: "If this email needs a code, we've sent a new one." });
    await codeEmailsSettled();
    expect(mailbox).toHaveLength(0);
  });

  it('an unverified account cannot log in: right password gets email_not_verified and a fresh code, no token', async () => {
    await register();
    await pool.query("UPDATE email_otps SET last_sent_at = now() - interval '61 seconds'");
    const res = await logIn(app, EMAIL, 'password12');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('email_not_verified');
    expect(res.body.token).toBeUndefined();
    await codeEmailsSettled();
    expect(mailbox).toHaveLength(2);
  });

  it('a wrong password says nothing about verification', async () => {
    await register();
    const res = await logIn(app, EMAIL, 'wrongpass99');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_login');
  });

  it('after verifying, login works', async () => {
    await register();
    await verify(await lastCode(EMAIL));
    expect((await logIn(app, EMAIL, 'password12')).status).toBe(200);
  });
});
