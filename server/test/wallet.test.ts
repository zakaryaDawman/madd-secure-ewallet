import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';

const app = createApp();

/** Registers a user and logs them in. Returns their id and session token. */
async function signUp(name: string, email: string, phone: string) {
  await request(app).post('/auth/register').send({ fullName: name, email, phone, password: 'password12', pin: '482913' });
  const res = await request(app).post('/auth/login').send({ email, password: 'password12' });
  return { id: res.body.user.id as number, token: res.body.token as string };
}

/** Calls GET /wallet with the given token. */
function getWallet(token?: string) {
  const req = request(app).get('/wallet');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
}

beforeAll(prepareTestDatabase);
beforeEach(clearTables);
afterAll(() => pool.end());

describe('GET /wallet: protection', () => {
  it('rejects a request with no token', async () => {
    expect((await getWallet()).status).toBe(401);
  });

  it('rejects a made-up token', async () => {
    expect((await getWallet('abc.def.ghi')).status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const fake = jwt.sign({ role: 'customer' }, 'not-the-secret', { subject: '1', expiresIn: '30m' });
    expect((await getWallet(fake)).status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expired = jwt.sign({ role: 'customer', exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET!, { subject: '1' });
    expect((await getWallet(expired)).status).toBe(401);
  });
});

describe('GET /wallet: data', () => {
  it('returns a new user with RM 1,000 and no activity', async () => {
    const zak = await signUp('Zakarya Dawman', 'zak@email.com', '0123456789');
    const res = await getWallet(zak.token);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ fullName: 'Zakarya Dawman', balanceSen: 100_000, recent: [] });
  });

  it("only ever shows the token owner's wallet", async () => {
    const zak = await signUp('Zakarya Dawman', 'zak@email.com', '0123456789');
    await signUp('Sara Lim', 'sara@email.com', '0198765432');
    await pool.query('UPDATE wallets SET balance_sen = 5 WHERE user_id <> $1', [zak.id]);
    const res = await getWallet(zak.token);
    expect(res.body.fullName).toBe('Zakarya Dawman');
    expect(res.body.balanceSen).toBe(100_000);
  });

  it('lists the last 3 transactions newest first, with the right direction and other name', async () => {
    const zak = await signUp('Zakarya Dawman', 'zak@email.com', '0123456789');
    const sara = await signUp('Sara Lim', 'sara@email.com', '0198765432');
    const insert = (from: number, to: number, sen: number, minutesAgo: number) =>
      pool.query(
        `INSERT INTO transactions (sender_id, receiver_id, amount_sen, status, created_at)
         VALUES ($1, $2, $3, 'COMPLETED', now() - ($4 || ' minutes')::interval)`,
        [from, to, sen, minutesAgo],
      );
    await insert(zak.id, sara.id, 1000, 40);
    await insert(sara.id, zak.id, 2500, 30);
    await insert(zak.id, sara.id, 9600, 20);
    await insert(sara.id, zak.id, 500, 10);

    const { body } = await getWallet(zak.token);
    expect(body.recent.map((t: { direction: string; amountSen: number }) => [t.direction, t.amountSen])).toEqual([
      ['in', 500],
      ['out', 9600],
      ['in', 2500],
    ]);
    expect(body.recent[0].otherName).toBe('Sara Lim');
  });
});
