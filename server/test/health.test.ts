import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';

afterAll(() => pool.end());

describe('GET /health', () => {
  /** The server and the database should both report as up. */
  it('returns ok when the database is reachable', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, db: true });
  });
});
