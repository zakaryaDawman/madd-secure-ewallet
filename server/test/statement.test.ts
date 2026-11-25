import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { signUp } from './helpers';

let app: Express;
let zak: { id: number; token: string };
let ahmad: { id: number; token: string };

/** GET the statement as Zakarya (or another token). */
function statement(query: string, token = zak.token) {
  return request(app).get(`/transactions/statement?${query}`).set('Authorization', `Bearer ${token}`);
}

/** Sends money between the two test users. */
function send(from: { token: string }, toPhone: string, amountSen: number) {
  return request(app).post('/transfers').set('Authorization', `Bearer ${from.token}`).send({ recipientPhone: toPhone, amountSen, note: 'Lunch', pin: '482913' });
}

/** Moves a transfer to a given time, so date ranges can be tested. */
async function setTime(id: number, isoTime: string): Promise<void> {
  await pool.query('UPDATE transactions SET created_at = $2 WHERE id = $1', [id, isoTime]);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
  ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
});
afterAll(() => pool.end());

describe('PDF statement data (G12)', () => {
  it('needs a token, and a valid range of at most a year', async () => {
    expect((await request(app).get('/transactions/statement?from=2026-11-01&to=2026-11-30')).status).toBe(401);
    expect((await statement('from=2026-11-30&to=2026-11-01')).status).toBe(400);
    expect((await statement('from=2025-01-01&to=2026-11-30')).status).toBe(400);
    expect((await statement('from=nope&to=2026-11-30')).status).toBe(400);
    expect((await statement('from=2026-11-01&to=2026-11-30&filter=held')).status).toBe(400);
  });

  it('lists my transfers in the Malaysian-date range, oldest first, masked, with totals and no balance', async () => {
    const out = (await send(zak, '0123454521', 2_000)).body.id;
    const inn = (await send(ahmad, '0123456789', 5_000)).body.id;
    const old = (await send(zak, '0123454521', 1_000)).body.id;
    await setTime(out, '2026-11-10T03:00:00Z');
    await setTime(inn, '2026-11-30T16:30:00Z'); // 1 Dec 12:30 AM in Malaysia: outside November
    await setTime(old, '2026-10-31T16:30:00Z'); // 1 Nov 12:30 AM in Malaysia: inside

    const { body } = await statement('from=2026-11-01&to=2026-11-30');
    expect(body.rows.map((r: { amountSen: number }) => r.amountSen)).toEqual([1_000, 2_000]);
    expect(body.rows[0]).toMatchObject({ direction: 'out', otherName: 'Ahm*** Ali', note: 'Lunch', status: 'COMPLETED' });
    expect(body.totals).toEqual({ inSen: 0, outSen: 3_000 });
    expect(body).toMatchObject({ ownerName: 'Zakarya Dawman', ownerPhone: '+60 12-*** 6789', truncated: false });
    expect(JSON.stringify(body)).not.toMatch(/balance/i);
  });

  it('filters In / Out and never shows other people\'s transfers', async () => {
    await send(zak, '0123454521', 2_000);
    await send(ahmad, '0123456789', 5_000);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
    const range = `from=${today}&to=${today}`;
    expect((await statement(`${range}&filter=in`)).body.totals).toEqual({ inSen: 5_000, outSen: 0 });
    expect((await statement(`${range}&filter=out`)).body.rows).toHaveLength(1);
    const third = await signUp(app, 'Sara Demo', 'sara@email.com', '0127778899');
    expect((await statement(range, third.token)).body.rows).toEqual([]);
  });

  it('a held transfer is listed but not counted in the totals', async () => {
    await send(zak, '0123454521', 80_000); // R1 holds it
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
    const { body } = await statement(`from=${today}&to=${today}`);
    expect(body.rows[0].status).toBe('PENDING');
    expect(body.totals).toEqual({ inSen: 0, outSen: 0 });
  });
});
