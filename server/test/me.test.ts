import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { clearTables, prepareTestDatabase } from './db';
import { logIn, signUp, TEST_DEVICE } from './helpers';

const OTHER_DEVICE = '22222222-2222-4222-8222-222222222222';

let app: Express;
let zak: { id: number; token: string };

/** Sends a request as Zakarya. */
function asZak(method: 'get' | 'patch' | 'post', path: string, token = zak.token) {
  return request(app)[method](path).set('Authorization', `Bearer ${token}`);
}

beforeAll(prepareTestDatabase);
beforeEach(async () => {
  await clearTables();
  app = createApp();
  zak = await signUp(app, 'Zakarya Dawman', 'zak@email.com', '0123456789');
});
afterAll(() => pool.end());

describe('GET /me', () => {
  it('returns my details and marks the phone in my token as this device', async () => {
    const other = await logIn(app, 'zak@email.com', 'password12', OTHER_DEVICE);
    const res = await asZak('get', '/me', other.body.token);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ fullName: 'Zakarya Dawman', email: 'zak@email.com', phone: '+60123456789' });
    expect(res.body.devices.map((d: { deviceId: string; trusted: boolean; thisDevice: boolean }) => [d.deviceId, d.trusted, d.thisDevice])).toEqual([
      [TEST_DEVICE, true, false],
      [OTHER_DEVICE, false, true],
    ]);
  });

  it('never returns passwords or PINs', async () => {
    const res = await asZak('get', '/me');
    expect(JSON.stringify(res.body)).not.toMatch(/password|pin_hash|\$2b\$/);
  });
});

describe('PATCH /me', () => {
  it('changes my name', async () => {
    const res = await asZak('patch', '/me').send({ fullName: '  Zak Dawman ' });
    expect(res.status).toBe(200);
    expect((await asZak('get', '/me')).body.fullName).toBe('Zak Dawman');
  });

  it('refuses to change email or phone', async () => {
    const res = await asZak('patch', '/me').send({ fullName: 'Zak Dawman', email: 'new@email.com' });
    expect(res.status).toBe(400);
    expect((await asZak('get', '/me')).body.email).toBe('zak@email.com');
  });
});

describe('POST /me/pin', () => {
  it('refuses a wrong current PIN and keeps the old PIN', async () => {
    const res = await asZak('post', '/me/pin').send({ currentPin: '000001', newPin: '739204' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('wrong_pin');
    expect((await asZak('post', '/me/pin').send({ currentPin: '482913', newPin: '739204' })).status).toBe(204);
  });

  it('refuses an easy new PIN', async () => {
    const res = await asZak('post', '/me/pin').send({ currentPin: '482913', newPin: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.fields.newPin).toBe('This PIN is too easy to guess');
  });

  it('the new PIN works for a transfer and the old one does not', async () => {
    await signUp(app, 'Ahmad Ali', 'ahmad@email.com', '0123454521');
    await asZak('post', '/me/pin').send({ currentPin: '482913', newPin: '739204' });
    const send = (pin: string) => asZak('post', '/transfers').send({ recipientPhone: '0123454521', amountSen: 100, note: '', pin });
    expect((await send('482913')).status).toBe(403);
    expect((await send('739204')).status).toBe(201);
  });
});
