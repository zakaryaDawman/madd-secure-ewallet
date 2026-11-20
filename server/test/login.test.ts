import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { verifyToken } from '../src/auth/tokens';
import { clearTables, prepareTestDatabase } from './db';

const app = createApp();
const account = {
  fullName: 'Zakarya Dawman',
  email: 'zakarya@email.com',
  phone: '012 345 6789',
  password: 'password12',
  pin: '482913',
};

/** Sends a login request with the given email and password. */
function login(email: unknown, password: unknown) {
  return request(app).post('/auth/login').send({ email, password });
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  await request(app).post('/auth/register').send(account);
});
afterAll(() => pool.end());

describe('POST /auth/login', () => {
  it('returns a valid 30-minute token for the right email and password', async () => {
    const res = await login('Zakarya@Email.com', 'password12');
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: expect.any(Number), fullName: 'Zakarya Dawman', role: 'customer' });

    const check = verifyToken(res.body.token);
    expect(check).toEqual({ ok: true, claims: { userId: res.body.user.id, role: 'customer', sessionId: expect.any(String) } });

    const payload = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64url').toString());
    expect(payload.exp - payload.iat).toBe(30 * 60);
  });

  it('never returns the password, PIN or hashes', async () => {
    const res = await login('zakarya@email.com', 'password12');
    expect(JSON.stringify(res.body)).not.toMatch(/password12|482913|\$2b\$/);
  });

  it('gives the same 401 message for a wrong password and an unknown email', async () => {
    const wrongPassword = await login('zakarya@email.com', 'wrongpass1');
    const unknownEmail = await login('nobody@email.com', 'password12');
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.message).toBe('Email or password is wrong');
  });

  it('rejects missing fields with 400', async () => {
    const res = await login('', '');
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields).sort()).toEqual(['email', 'password']);
  });
});

describe('verifyToken', () => {
  it('rejects a tampered token', async () => {
    const res = await login('zakarya@email.com', 'password12');
    const [head, body, sig] = res.body.token.split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), role: 'admin' })).toString('base64url');
    expect(verifyToken(`${head}.${forged}.${sig}`)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects garbage', () => {
    expect(verifyToken('not-a-token')).toEqual({ ok: false, reason: 'invalid' });
  });
});
