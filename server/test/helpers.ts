import request from 'supertest';
import type { Express } from 'express';

/** Registers a user and logs them in. Returns their id and session token. */
export async function signUp(app: Express, name: string, email: string, phone: string) {
  await request(app).post('/auth/register').send({ fullName: name, email, phone, password: 'password12', pin: '482913' });
  const res = await request(app).post('/auth/login').send({ email, password: 'password12' });
  return { id: res.body.user.id as number, token: res.body.token as string };
}
