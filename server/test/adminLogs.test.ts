import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { seedAdmin } from '../src/db/seedAdmin';
import { logSecurityEvent } from '../src/services/securityLog';
import { codeEmailsSettled } from '../src/services/emailOtp';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';

const ADMIN_ENV = { ADMIN_EMAIL: 'admin@madd.test', ADMIN_PASSWORD: 'test-admin-pass-1', ADMIN_NAME: 'Test Admin', ADMIN_PHONE: '019 999 9999' };

type Entry = { id: number; code: string; tone: string; name: string; line: string };

let app: Express;
let admin: string;
let zak: { id: number; token: string };

/** The log as the admin sees it, with an optional search and page. */
async function logs(query = ''): Promise<{ entries: Entry[]; nextBefore: number | null }> {
  return (await request(app).get(`/admin/logs${query}`).set('Authorization', `Bearer ${admin}`)).body;
}

/** Gives Zakarya a usual transfer of RM 96, then sends RM 800 (held by R1). */
async function holdRM800(): Promise<void> {
  await pool.query(
    `INSERT INTO transactions (sender_id, receiver_id, amount_sen, status, created_at, completed_at)
     SELECT $1, id, 9600, 'COMPLETED', now() - interval '1 day', now() - interval '1 day' FROM users WHERE email = 'ahmad@email.com'`,
    [zak.id],
  );
  await request(app).post('/transfers').set('Authorization', `Bearer ${zak.token}`).send({ recipientPhone: '012 345 4521', amountSen: 80_000, note: '', pin: '482913' });
  await codeEmailsSettled(); // its "Email code sent" row is logged right after the hold
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
  await seedAdmin(pool, ADMIN_ENV);
  admin = (await logIn(app, ADMIN_ENV.ADMIN_EMAIL, ADMIN_ENV.ADMIN_PASSWORD)).body.token;
});
afterAll(() => pool.end());

describe('GET /admin/logs (design 22)', () => {
  it('shows every kind of event, newest first, with its code, colour and line', async () => {
    await holdRM800();
    await logIn(app, 'zak@email.com', 'password12', '22222222-2222-4222-8222-222222222222'); // R3
    for (let i = 0; i < 5; i++) await logIn(app, 'ahmad@email.com', 'wrongpass99'); // R4
    await request(app).post('/me/freeze').set('Authorization', `Bearer ${zak.token}`).send({ pin: '482913' });
    const { entries } = await logs();
    expect(entries.map((e) => [e.code, e.tone, e.name])).toEqual([
      ['ACCOUNT_FROZEN', 'danger', 'Zakarya D.'],
      ['R4 FAILED_LOGINS', 'danger', 'Ahmad A.'],
      ['R3 UNKNOWN_DEVICE', 'info', 'Zakarya D.'],
      ['OTP_SENT', 'plain', 'Zakarya D.'],
      ['R1 LARGE_AMOUNT', 'warning', 'Zakarya D.'],
    ]);
    expect(entries[4].line).toBe('RM 800 > max(RM 500, 3 × avg RM 96). Held.');
    expect(entries[1].line).toBe('5 failures in under 1 min. Login locked 15 min.');
  });

  it('searches by user name, by rule and by event type', async () => {
    await holdRM800();
    for (let i = 0; i < 5; i++) await logIn(app, 'ahmad@email.com', 'wrongpass99');
    expect((await logs('?q=ahmad')).entries.map((e) => e.code)).toEqual(['R4 FAILED_LOGINS']);
    expect((await logs('?q=r1')).entries.map((e) => e.code)).toEqual(['R1 LARGE_AMOUNT']);
    expect((await logs('?q=large_amount')).entries.map((e) => e.code)).toEqual(['R1 LARGE_AMOUNT']);
    expect((await logs('?q=zakarya')).entries.map((e) => e.name)).toEqual(['Zakarya D.', 'Zakarya D.']);
  });

  it('treats search text as plain text (no SQL injection, % is not a wildcard)', async () => {
    await holdRM800();
    expect((await logs(`?q=${encodeURIComponent("%' OR 1=1 --")}`)).entries).toEqual([]);
    expect((await logs('?q=%25')).entries).toEqual([]);
  });

  it('pages 50 at a time with no repeats and no gaps', async () => {
    for (let i = 0; i < 60; i++) await logSecurityEvent({ userId: zak.id, type: 'PIN_LOCKED', reason: `test ${i}` });
    const first = await logs();
    expect(first.entries).toHaveLength(50);
    const second = await logs(`?before=${first.nextBefore}`);
    expect(second.entries).toHaveLength(10);
    expect(second.nextBefore).toBeNull();
    const ids = [...first.entries, ...second.entries].map((e) => e.id);
    expect(new Set(ids).size).toBe(60);
    expect(ids).toEqual([...ids].sort((a, b) => b - a));
  });

  it('never shows emails, phones, device ids, hashes or tokens', async () => {
    await holdRM800();
    await logIn(app, 'zak@email.com', 'password12', '22222222-2222-4222-8222-222222222222');
    expect(JSON.stringify(await logs())).not.toMatch(/zak@email|\+6012|22222222-|\$2b\$|token/);
  });
});

describe('nothing in the log can be edited', () => {
  it.each(['put', 'patch', 'delete'] as const)('there is no %s route on /admin/logs', async (method) => {
    const res = await request(app)[method]('/admin/logs').set('Authorization', `Bearer ${admin}`);
    expect(res.status).toBe(404);
  });

  it('the database refuses to change or remove rows, even for the server itself', async () => {
    await holdRM800();
    await expect(pool.query("UPDATE security_events SET reason = 'nothing happened'")).rejects.toThrow(/append-only/);
    await expect(pool.query('DELETE FROM security_events')).rejects.toThrow(/append-only/);
    await expect(pool.query('TRUNCATE security_events')).rejects.toThrow(/append-only/);
  });

  it('a customer cannot read the log', async () => {
    expect((await request(app).get('/admin/logs').set('Authorization', `Bearer ${zak.token}`)).status).toBe(403);
  });
});
