import request from 'supertest';
import type { Express } from 'express';
import { pool } from '../src/db/pool';
import { codeEmailsSettled } from '../src/services/emailOtp';
import { mailbox } from './mailbox';

/** The phone id the tests log in from, unless a test picks another one. */
export const TEST_DEVICE = '11111111-1111-4111-8111-111111111111';

/** POST /auth/login from a device, like the phone does. */
export function logIn(app: Express, email: string, password: string, deviceId = TEST_DEVICE) {
  return request(app).post('/auth/login').send({ email, password, deviceId, deviceName: 'Test Phone' });
}

/**
 * Registers a user and logs them in. Returns their id and session token.
 * The email is marked verified straight in the database (the real code flow is tested in verifyEmail.test.ts),
 * and the sign-up email is cleared, so other tests only see their own emails and log rows.
 */
export async function signUp(app: Express, name: string, email: string, phone: string) {
  await request(app).post('/auth/register').send({ fullName: name, email, phone, password: 'password12', pin: '482913' });
  await pool.query('UPDATE users SET email_verified_at = now() WHERE email = $1', [email]);
  await codeEmailsSettled();
  mailbox.length = 0;
  const res = await logIn(app, email, 'password12');
  return { id: res.body.user.id as number, token: res.body.token as string };
}
