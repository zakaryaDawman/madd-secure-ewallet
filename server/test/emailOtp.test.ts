import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { signUp } from './helpers';
import { lastCode, mailbox } from './mailbox';

const ZAK_EMAIL = 'zak@email.com';

let app: Express;
let zak: { id: number; token: string };
let ahmad: { id: number; token: string };

/** POST as a user (Zakarya unless another token is given). */
function post(path: string, body: object = {}, token = zak.token) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

/** Zakarya sends RM 800 with no history, so rule R1 holds it and a code is emailed. Returns the transfer id and the code. */
async function hold(): Promise<{ id: number; code: string }> {
  const res = await post('/transfers', { recipientPhone: '012 345 4521', amountSen: 80_000, note: '', pin: '482913' });
  expect(res.status).toBe(202);
  return { id: res.body.id, code: await lastCode(ZAK_EMAIL) };
}

/** Any 6-digit code that isn't the right one. */
function wrong(code: string): string {
  return code === '000000' ? '111111' : '000000';
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', ZAK_EMAIL, '0123456789');
  ahmad = await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
});
afterAll(() => pool.end());

describe('the code email (G4)', () => {
  it('goes to the owner only, with a 6-digit code, and only the hash is stored', async () => {
    const { id, code } = await hold();
    expect(mailbox.map((m) => m.to)).toEqual([ZAK_EMAIL]);
    expect(mailbox[0].text).toContain('RM 800');
    const { rows } = await pool.query('SELECT code_hash FROM email_otps WHERE transaction_id = $1', [id]);
    expect(rows[0].code_hash).not.toContain(code);
    expect(rows[0].code_hash).toMatch(/^\$2[aby]\$/);
  });

  it('is never in any API reply, and the Held screen shows where it went (masked)', async () => {
    const { id, code } = await hold();
    const details = await request(app).get(`/transactions/${id}`).set('Authorization', `Bearer ${zak.token}`);
    expect(JSON.stringify(details.body)).not.toContain(code);
    expect(details.body.hold.codeSentTo).toBe('z**@email.com');
  });
});

describe('Yes with the code (G4)', () => {
  it('needs the code as well as the PIN', async () => {
    const { id } = await hold();
    expect((await post(`/transfers/${id}/confirm`, { pin: '482913' })).status).toBe(400);
  });

  it('a wrong code says how many tries are left and moves nothing', async () => {
    const { id, code } = await hold();
    const res = await post(`/transfers/${id}/confirm`, { pin: '482913', code: wrong(code) });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: 'wrong_code', triesLeft: 4 });
    expect(JSON.stringify(res.body)).not.toContain(code);
  });

  it('locks the code on the 5th wrong try: even the right code is refused, and it is logged', async () => {
    const { id, code } = await hold();
    for (let i = 0; i < 4; i++) await post(`/transfers/${id}/confirm`, { pin: '482913', code: wrong(code) });
    expect((await post(`/transfers/${id}/confirm`, { pin: '482913', code: wrong(code) })).status).toBe(423);
    expect((await post(`/transfers/${id}/confirm`, { pin: '482913', code })).body.error).toBe('code_locked');
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM security_events WHERE type = 'OTP_LOCKED'");
    expect(rows[0].n).toBe(1);
    expect((await post(`/transfers/${id}/reject`)).status).toBe(200); // the owner can still say No
  });

  it('refuses an expired code', async () => {
    const { id, code } = await hold();
    await pool.query("UPDATE email_otps SET expires_at = now() - interval '1 second' WHERE transaction_id = $1", [id]);
    const res = await post(`/transfers/${id}/confirm`, { pin: '482913', code });
    expect(res.status).toBe(410);
    expect(res.body.error).toBe('code_expired');
  });

  it('a code works once: reusing it after the money moved is refused', async () => {
    const { id, code } = await hold();
    expect((await post(`/transfers/${id}/confirm`, { pin: '482913', code })).status).toBe(201);
    expect((await post(`/transfers/${id}/confirm`, { pin: '482913', code })).status).toBe(410);
  });

  it("another user can't use the owner's code", async () => {
    const { id, code } = await hold();
    expect((await post(`/transfers/${id}/confirm`, { pin: '482913', code }, ahmad.token)).status).toBe(404);
  });

  it('a code for one transfer does not work for another', async () => {
    const first = await hold();
    const second = await hold();
    if (first.code === second.code) return; // 1 in a million: both codes happen to be the same
    const res = await post(`/transfers/${second.id}/confirm`, { pin: '482913', code: first.code });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('wrong_code');
  });
});

describe('Resend code (G4)', () => {
  it('waits 60 seconds between emails', async () => {
    const { id } = await hold();
    const res = await post(`/transfers/${id}/resend-code`);
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('resend_cooldown');
    expect(mailbox).toHaveLength(1);
  });

  it('sends a new code that replaces the old one', async () => {
    const { id, code: oldCode } = await hold();
    await pool.query("UPDATE email_otps SET last_sent_at = now() - interval '61 seconds' WHERE transaction_id = $1", [id]);
    expect((await post(`/transfers/${id}/resend-code`)).status).toBe(200);
    const newCode = await lastCode(ZAK_EMAIL);
    expect(mailbox).toHaveLength(2);
    if (newCode !== oldCode) expect((await post(`/transfers/${id}/confirm`, { pin: '482913', code: oldCode })).status).toBe(403);
    expect((await post(`/transfers/${id}/confirm`, { pin: '482913', code: newCode })).status).toBe(201);
  });

  it('stops after 3 emails', async () => {
    const { id } = await hold();
    await pool.query("UPDATE email_otps SET sends = 3, last_sent_at = now() - interval '10 minutes' WHERE transaction_id = $1", [id]);
    expect((await post(`/transfers/${id}/resend-code`)).body.error).toBe('resend_limit');
  });

  it("can't ask for a code for someone else's transfer", async () => {
    const { id } = await hold();
    expect((await post(`/transfers/${id}/resend-code`, {}, ahmad.token)).status).toBe(404);
  });
});
