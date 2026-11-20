import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { maskName, maskPhone } from '../src/utils/mask';
import { clearTables, prepareTestDatabase } from './db';
import { signUp } from './helpers';

let app: Express;
let zak: { id: number; token: string };
let ahmad: { id: number; token: string };

/** Looks up a phone number as Zakarya. */
function lookup(phone: string, token = zak.token) {
  return request(app).get('/users/lookup').query({ phone }).set('Authorization', `Bearer ${token}`);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp(); // fresh rate-limit counter for every test
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
});
afterAll(() => pool.end());

describe('GET /users/lookup', () => {
  it('finds a user and shows only a masked name and phone', async () => {
    const res = await lookup('012-345 4521');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ phone: '+60123454521', maskedName: 'Ahm*** Ali', maskedPhone: '+60 12-*** 4521' });
    expect(JSON.stringify(res.body)).not.toContain('Ahmad');
  });

  it('says not found for an unknown number', async () => {
    const res = await lookup('0198881234');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
  });

  it("refuses the sender's own number", async () => {
    const res = await lookup('+60 12 345 6789');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('self');
  });

  it('rejects a number that is not Malaysian', async () => {
    const res = await lookup('12345');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_phone');
  });

  it('needs a valid session', async () => {
    const res = await request(app).get('/users/lookup').query({ phone: '0123454521' });
    expect(res.status).toBe(401);
  });

  it('allows 10 lookups a minute, then blocks with 429', async () => {
    for (let i = 0; i < 10; i++) expect((await lookup('0198881234')).status).toBe(404);
    const blocked = await lookup('0123454521');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe('rate_limited');
  });

  it('counts each user separately', async () => {
    for (let i = 0; i < 10; i++) await lookup('0198881234');
    expect((await lookup('0123456789', ahmad.token)).status).toBe(200);
  });
});

describe('GET /users/recent', () => {
  it('lists people the user sent money to, newest first, without repeats', async () => {
    const sara = await signUp(app, 'Sara Lim', 'sara@email.com', '0171112222');
    const send = (to: number, minutesAgo: number) =>
      pool.query(
        `INSERT INTO transactions (sender_id, receiver_id, amount_sen, status, created_at)
         VALUES ($1, $2, 100, 'COMPLETED', now() - ($3 || ' minutes')::interval)`,
        [zak.id, to, minutesAgo],
      );
    await send(ahmad.id, 30);
    await send(sara.id, 20);
    await send(ahmad.id, 10);

    const res = await request(app).get('/users/recent').set('Authorization', `Bearer ${zak.token}`);
    expect(res.body.map((r: { firstName: string }) => r.firstName)).toEqual(['Ahmad', 'Sara']);
    expect(res.body[0].maskedName).toBe('Ahm*** Ali');
  });
});

describe('masking helpers', () => {
  it('keeps the last word and hides the rest', () => {
    expect(maskName('Muhammad Hafiz')).toBe('Muh*** Hafiz');
    expect(maskName('Siti Nur Aisyah')).toBe('Sit*** Nur*** Aisyah');
    expect(maskName('Zakarya')).toBe('Zak***');
  });

  it('hides the middle of the phone number', () => {
    expect(maskPhone('+601123456789')).toBe('+60 11-*** 6789');
  });
});
