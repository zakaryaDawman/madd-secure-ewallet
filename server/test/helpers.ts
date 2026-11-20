import request from 'supertest';
import type { Express } from 'express';

/** The phone id the tests log in from, unless a test picks another one. */
export const TEST_DEVICE = '11111111-1111-4111-8111-111111111111';

/** POST /auth/login from a device, like the phone does. */
export function logIn(app: Express, email: string, password: string, deviceId = TEST_DEVICE) {
  return request(app).post('/auth/login').send({ email, password, deviceId, deviceName: 'Test Phone' });
}

/** Registers a user and logs them in. Returns their id and session token. */
export async function signUp(app: Express, name: string, email: string, phone: string) {
  await request(app).post('/auth/register').send({ fullName: name, email, phone, password: 'password12', pin: '482913' });
  const res = await logIn(app, email, 'password12');
  return { id: res.body.user.id as number, token: res.body.token as string };
}
