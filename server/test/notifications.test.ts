import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp } from './helpers';

const NEW_PHONE = '22222222-2222-4222-8222-222222222222';

let app: Express;
let zak: { id: number; token: string };
let ahmad: { id: number; token: string };

/** GET as a user. */
function get(path: string, token = zak.token) {
  return request(app).get(path).set('Authorization', `Bearer ${token}`);
}

/** POST as a user. */
function post(path: string, body: object = {}, token = zak.token) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

/** Zakarya sends money to Ahmad with the right PIN. */
function send(amountSen: number, token = zak.token) {
  return post('/transfers', { recipientPhone: '012 345 4521', amountSen, note: '', pin: '482913' }, token);
}

/** The titles in one Inbox tab, newest first. */
async function titles(tab: 'all' | 'security', token = zak.token): Promise<string[]> {
  const res = await get(`/notifications?tab=${tab}`, token);
  return res.body.items.map((i: { title: string }) => i.title);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
});
afterAll(() => pool.end());

describe('money events (All tab)', () => {
  it('a new account starts with "Welcome to MADD"', async () => {
    expect(await titles('all')).toEqual(['Welcome to MADD']);
  });

  it('a transfer tells the sender "Money sent" and the recipient "Money received"', async () => {
    await send(5_000);
    const mine = (await get('/notifications?tab=all')).body.items[0];
    expect(mine).toMatchObject({ title: 'Money sent', body: 'To Ahmad Ali', amountSen: 5_000 });
    const theirs = (await get('/notifications?tab=all', ahmad.token)).body.items[0];
    expect(theirs).toMatchObject({ title: 'Money received', body: 'From Zakarya Dawman', amountSen: 5_000 });
  });
});

describe('held transfers', () => {
  it('a held transfer shows in All and as the card with Yes / No on top of Security; the recipient hears nothing', async () => {
    const { body } = await send(80_000);
    expect((await titles('all'))[0]).toBe('Transfer waiting for you');
    const security = await get('/notifications?tab=security');
    expect(security.body.pending).toEqual([
      expect.objectContaining({ transactionId: body.id, amountSen: 80_000, otherName: 'Ahmad Ali', canDecide: true }),
    ]);
    expect(await titles('all', ahmad.token)).toEqual(['Welcome to MADD']);
  });

  it('after Yes: the card goes, Security says "You confirmed a held transfer", and the recipient gets "Money received"', async () => {
    const { body } = await send(80_000);
    await post(`/transfers/${body.id}/confirm`, { pin: '482913' });
    const security = await get('/notifications?tab=security');
    expect(security.body.pending).toEqual([]);
    expect(security.body.items[0]).toMatchObject({ title: 'You confirmed a held transfer', body: 'RM 800.00 to Ahmad Ali was sent.' });
    expect((await titles('all'))[0]).toBe('Held transfer sent');
    expect((await titles('all', ahmad.token))[0]).toBe('Money received');
  });

  it('after the 5 minutes run out the card goes and the item says cancelled', async () => {
    const { body } = await send(80_000);
    await pool.query("UPDATE transactions SET expires_at = now() - interval '1 second' WHERE id = $1", [body.id]);
    expect((await get('/notifications?tab=security')).body.pending).toEqual([]);
    expect((await titles('all'))[0]).toBe('Held transfer cancelled');
  });
});

describe('security events (Security tab)', () => {
  it('a new phone shows "New device signed in", and the text changes once it is trusted', async () => {
    await logIn(app, 'zak@email.com', 'password12', NEW_PHONE);
    const before = (await get('/notifications?tab=security')).body.items[0];
    expect(before).toMatchObject({ title: 'New device signed in', body: 'Test Phone. Transfers from it are on hold until you trust it.' });
    await post(`/me/devices/${NEW_PHONE}/trust`, { pin: '482913' });
    expect((await get('/notifications?tab=security')).body.items[0].body).toBe('Test Phone. You trusted this device.');
  });

  it('5 wrong passwords show "5 wrong password attempts" with Freeze my account', async () => {
    for (let i = 0; i < 5; i++) await logIn(app, 'zak@email.com', 'wrongpass99');
    expect((await get('/notifications?tab=security')).body.items[0]).toMatchObject({ title: '5 wrong password attempts', canFreeze: true });
  });

  it('5 wrong PINs show "5 wrong PIN attempts"', async () => {
    for (let i = 0; i < 5; i++) await post('/transfers', { recipientPhone: '012 345 4521', amountSen: 1_000, note: '', pin: '135792' });
    expect(await titles('security')).toEqual(['5 wrong PIN attempts']);
  });

  it('"Freeze my account" freezes and logs out; an untrusted phone cannot use it', async () => {
    const newPhone = (await logIn(app, 'zak@email.com', 'password12', NEW_PHONE)).body.token;
    expect((await post('/me/freeze', {}, newPhone)).status).toBe(403);
    expect((await post('/me/freeze')).status).toBe(200);
    expect((await get('/wallet')).body.error).toBe('account_frozen');
  });
});

describe('unread and privacy', () => {
  it('counts unread per tab and resets a tab when it is read', async () => {
    await send(5_000);
    await logIn(app, 'zak@email.com', 'password12', NEW_PHONE);
    expect((await get('/notifications/unread')).body).toEqual({ all: 2, security: 1 });
    await post('/notifications/read', { tab: 'security' });
    expect((await get('/notifications/unread')).body).toEqual({ all: 2, security: 0 });
  });

  it("never shows someone else's notifications", async () => {
    await send(5_000);
    const theirs = await titles('all', ahmad.token);
    expect(theirs).not.toContain('Money sent');
  });
});
