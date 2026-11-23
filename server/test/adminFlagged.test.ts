import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { seedAdmin } from '../src/db/seedAdmin';
import { pushesSettled, setPushSender } from '../src/services/push';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';
import { lastCode } from './mailbox';

const ADMIN_ENV = { ADMIN_EMAIL: 'admin@madd.test', ADMIN_PASSWORD: 'test-admin-pass-1', ADMIN_NAME: 'Test Admin', ADMIN_PHONE: '019 999 9999' };
const NEW_PHONE = '22222222-2222-4222-8222-222222222222';

type Item = { id: number; rule: string; userName: string; summary: string; facts: string[]; badge: { status: string; label: string } };

let app: Express;
let admin: string;
let zak: { id: number; token: string };

/** GET as the admin (or another token). */
function get(path: string, token = admin) {
  return request(app).get(path).set('Authorization', `Bearer ${token}`);
}

/** Zakarya sends money to Ahmad, from his usual phone unless another token is given. */
function send(amountSen: number, token = zak.token) {
  return request(app).post('/transfers').set('Authorization', `Bearer ${token}`).send({ recipientPhone: '012 345 4521', amountSen, note: '', pin: '482913' });
}

/** Gives Zakarya a usual transfer of RM 96. */
async function usualTransferIsRM96(): Promise<void> {
  await pool.query(
    `INSERT INTO transactions (sender_id, receiver_id, amount_sen, status, created_at, completed_at)
     SELECT $1, id, 9600, 'COMPLETED', now() - interval '1 day', now() - interval '1 day' FROM users WHERE email = 'ahmad@email.com'`,
    [zak.id],
  );
}

/** The Flagged list as the admin sees it. */
async function flagged(query = ''): Promise<Item[]> {
  return (await get(`/admin/flagged${query}`)).body.items;
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  setPushSender(null);
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
  await seedAdmin(pool, ADMIN_ENV);
  admin = (await logIn(app, ADMIN_ENV.ADMIN_EMAIL, ADMIN_ENV.ADMIN_PASSWORD)).body.token;
});
afterAll(async () => {
  await pushesSettled();
  await pool.end();
});

describe('R1: RM 800 when the usual transfer is RM 96 (designs 21 and 48)', () => {
  it('appears on the list as Pending with the usual amount and the device', async () => {
    await usualTransferIsRM96();
    await send(80_000);
    expect(await flagged()).toEqual([
      expect.objectContaining({
        rule: 'R1',
        userName: 'Zakarya Dawman',
        summary: 'R1 Large amount · RM 800.00 to Ahmad Ali',
        facts: ['Usual transfer RM 96', 'Test Phone (trusted)'],
        badge: expect.objectContaining({ status: 'pending', label: 'Pending' }),
      }),
    ]);
  });

  it('the detail shows the exact calculation, severity and timeline', async () => {
    await usualTransferIsRM96();
    await send(80_000);
    const [item] = await flagged();
    const { body } = await get(`/admin/flagged/${item.id}`);
    expect(body).toMatchObject({
      code: 'R1 LARGE_AMOUNT',
      headline: 'RM 800.00 held',
      userName: 'Zakarya Dawman',
      recipientName: 'Ahmad Ali',
      device: 'Test Phone (trusted)',
      severity: 'Medium',
      calculation: 'Amount RM 800 > limit max(RM 500, 3 × average RM 96 = RM 288) = RM 500',
    });
    expect(body.timeline.map((s: { label: string }) => s.label)).toEqual([
      'Transfer submitted',
      'R1 flagged, transfer held',
      'Email code sent to the owner',
      expect.stringMatching(/^Waiting for user · expires \d\d:\d\d:\d\d$/),
    ]);
  });

  it('shows the push alert in the timeline when one was sent', async () => {
    setPushSender(async () => true);
    await request(app).post('/me/push-token').set('Authorization', `Bearer ${zak.token}`).send({ token: 'usual-phone-token' });
    await send(80_000);
    await pushesSettled();
    const [item] = await flagged();
    const labels = (await get(`/admin/flagged/${item.id}`)).body.timeline.map((s: { label: string }) => s.label);
    expect(labels[2]).toBe('Alert sent to 1 trusted phone');
  });

  it('shows Confirmed after the owner says Yes', async () => {
    const { id } = (await send(80_000)).body;
    await request(app).post(`/transfers/${id}/confirm`).set('Authorization', `Bearer ${zak.token}`).send({ pin: '482913', code: await lastCode('zak@email.com') });
    const [item] = await flagged();
    expect(item.badge.label).toBe('Confirmed');
    const labels = (await get(`/admin/flagged/${item.id}`)).body.timeline.map((s: { label: string }) => s.label);
    expect(labels.at(-1)).toBe('Owner confirmed with PIN and email code, money sent');
  });

  it('shows Rejected, with "Account frozen", after the owner says No', async () => {
    const { id } = (await send(80_000)).body;
    await request(app).post(`/transfers/${id}/reject`).set('Authorization', `Bearer ${zak.token}`).send({});
    const [item] = await flagged();
    expect(item.badge.label).toBe('Rejected');
    expect(item.facts).toContain('Account frozen');
  });

  it('shows Expired when nobody answered in 5 minutes', async () => {
    const { id } = (await send(80_000)).body;
    await pool.query("UPDATE transactions SET expires_at = now() - interval '1 second' WHERE id = $1", [id]);
    expect((await flagged())[0].badge.label).toBe('Expired');
  });
});

describe('R2, R3 and R4 appear too', () => {
  it('R2: the 4th transfer in 5 minutes', async () => {
    for (let i = 0; i < 4; i++) await send(1_000);
    const [item] = await flagged('?rule=R2');
    expect(item.summary).toBe('R2 Velocity · 4 transfers in under a minute');
  });

  it('R3: a login from a new phone, and a transfer from it', async () => {
    const newPhone = (await logIn(app, 'zak@email.com', 'password12', NEW_PHONE)).body.token;
    await send(1_000, newPhone);
    const items = await flagged('?rule=R3');
    expect(items.map((i) => [i.summary, i.badge.label])).toEqual([
      ['R3 New device · Transfer RM 10.00 held', 'Pending'],
      ['R3 New device · New login', 'New login'],
    ]);
    const detail = (await get(`/admin/flagged/${items[1].id}`)).body;
    expect(detail).toMatchObject({ severity: 'High', device: 'Test Phone (untrusted)', calculation: "Test Phone is not one of the user's 1 trusted device(s)" });
  });

  it('R4: 5 wrong passwords show "Locked 15 min", then "Lock ended"', async () => {
    for (let i = 0; i < 5; i++) await logIn(app, 'zak@email.com', 'wrongpass99');
    const [item] = await flagged('?rule=R4');
    expect(item.summary).toBe('R4 Failed logins · 5 attempts in under a minute');
    expect(item.badge.label).toBe('Locked 15 min');
    expect((await get(`/admin/flagged/${item.id}`)).body.calculation).toBe(
      '5 wrong passwords in under a minute ≥ 5 allowed in 15 minutes, so sign-in was locked',
    );
    await pool.query("UPDATE login_attempts SET created_at = created_at - interval '16 minutes'");
    expect((await flagged('?rule=R4'))[0].badge.label).toBe('Lock ended');
  });
});

describe('filters, privacy and roles', () => {
  it('filters by rule and by status', async () => {
    await send(80_000); // R1 pending
    for (let i = 0; i < 5; i++) await logIn(app, 'zak@email.com', 'wrongpass99'); // R4 locked
    expect((await flagged('?rule=R4')).map((i) => i.rule)).toEqual(['R4']);
    expect((await flagged('?status=pending')).map((i) => i.rule)).toEqual(['R1']);
    expect((await flagged('?status=locked')).map((i) => i.rule)).toEqual(['R4']);
  });

  it('never shows emails, phones, hashes or tokens', async () => {
    await send(80_000);
    const [item] = await flagged();
    const all = JSON.stringify([await flagged(), (await get(`/admin/flagged/${item.id}`)).body]);
    expect(all).not.toMatch(/zak@email|\+6012|\$2b\$|password|pin_hash|push_token/);
  });

  it('a customer gets 403, and an unknown id gets 404', async () => {
    expect((await get('/admin/flagged', zak.token)).status).toBe(403);
    expect((await get('/admin/flagged/99999')).status).toBe(404);
  });
});
