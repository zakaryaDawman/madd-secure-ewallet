import request from 'supertest';
import jwt from 'jsonwebtoken';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp, TEST_DEVICE } from './helpers';

let app: Express;
let zak: { id: number; token: string };

/** GET /wallet with an optional Authorization header value. */
function getWallet(authorization?: string) {
  const req = request(app).get('/wallet');
  return authorization === undefined ? req : req.set('Authorization', authorization);
}

/** POST /auth/logout with a token. */
function logout(token: string) {
  return request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`);
}

/** Reads the session id out of a token (the "sid" claim). */
function sessionIdOf(token: string): string {
  return (jwt.decode(token) as jwt.JwtPayload).sid;
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
});
afterAll(() => pool.end());

describe('login creates a session', () => {
  it('stores one 30-minute session and puts its id in the token', async () => {
    const { rows } = await pool.query(
      "SELECT id, user_id, revoked_at, round(extract(epoch FROM expires_at - created_at) / 60) AS minutes FROM sessions",
    );
    expect(rows).toEqual([{ id: sessionIdOf(zak.token), user_id: zak.id, revoked_at: null, minutes: '30' }]);
  });
});

describe('requests are rejected with 401 when the token is', () => {
  it('missing', async () => {
    const res = await getWallet();
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('missing_token');
  });

  it('not a real token', async () => {
    expect((await getWallet('Bearer not-a-token')).body.error).toBe('invalid_token');
  });

  it('signed with the wrong secret', async () => {
    const fake = jwt.sign({ role: 'customer', sid: sessionIdOf(zak.token) }, 'not-the-secret', { subject: String(zak.id), expiresIn: '30m' });
    expect((await getWallet(`Bearer ${fake}`)).body.error).toBe('invalid_token');
  });

  it('expired (JWT past its 30 minutes)', async () => {
    const expired = jwt.sign(
      { role: 'customer', sid: sessionIdOf(zak.token), exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET!,
      { subject: String(zak.id) },
    );
    const res = await getWallet(`Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('session_expired');
  });

  it('for a session the database says has expired', async () => {
    await pool.query("UPDATE sessions SET expires_at = now() - interval '1 second'");
    expect((await getWallet(`Bearer ${zak.token}`)).body.error).toBe('session_expired');
  });

  it('cancelled by logout', async () => {
    expect((await logout(zak.token)).status).toBe(204);
    const res = await getWallet(`Bearer ${zak.token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('session_revoked');
  });

  it('for a session that does not exist', async () => {
    const madeUp = jwt.sign({ role: 'customer', sid: '00000000-0000-0000-0000-000000000000', did: TEST_DEVICE }, process.env.JWT_SECRET!, {
      subject: String(zak.id),
      expiresIn: '30m',
    });
    expect((await getWallet(`Bearer ${madeUp}`)).body.error).toBe('session_revoked');
  });

  it('for a session that belongs to someone else', async () => {
    const ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
    const stolen = jwt.sign({ role: 'customer', sid: sessionIdOf(ahmad.token), did: TEST_DEVICE }, process.env.JWT_SECRET!, {
      subject: String(zak.id),
      expiresIn: '30m',
    });
    expect((await getWallet(`Bearer ${stolen}`)).body.error).toBe('session_revoked');
  });

  it('every refusal has the same message', async () => {
    const missing = await getWallet();
    await logout(zak.token);
    const revoked = await getWallet(`Bearer ${zak.token}`);
    expect(missing.body.message).toBe(revoked.body.message);
  });
});

describe('POST /auth/logout', () => {
  it('cancels only this session; another login keeps working', async () => {
    const second = await logIn(app, 'zak@email.com', 'password12');
    await logout(zak.token);
    expect((await getWallet(`Bearer ${zak.token}`)).status).toBe(401);
    expect((await getWallet(`Bearer ${second.body.token}`)).status).toBe(200);
  });

  it('records why the session ended', async () => {
    await logout(zak.token);
    const { rows } = await pool.query('SELECT revoke_reason FROM sessions WHERE id = $1', [sessionIdOf(zak.token)]);
    expect(rows[0].revoke_reason).toBe('logout');
  });

  it('needs a valid token', async () => {
    expect((await request(app).post('/auth/logout')).status).toBe(401);
  });
});
