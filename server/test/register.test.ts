import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/db/pool';
import { isWeakPin, normalisePhone } from '../src/validation/register';
import { clearTables, prepareTestDatabase } from './db';

const app = createApp();

/** A valid sign-up body; each test changes one field. */
const valid = {
  fullName: 'Zakarya Dawman',
  email: 'Zakarya@Email.com',
  phone: '012 345 6789',
  password: 'password12',
  pin: '482913',
};

/** Sends a register request with the valid body plus any overrides. */
function register(overrides: Partial<Record<keyof typeof valid, unknown>> = {}) {
  return request(app).post('/auth/register').send({ ...valid, ...overrides });
}

beforeAll(prepareTestDatabase);
beforeEach(clearTables);
afterAll(() => pool.end());

describe('POST /auth/register: success', () => {
  it('creates the user with an RM 1,000 wallet and stores only hashes', async () => {
    const res = await register();
    expect(res.status).toBe(201);

    const { rows } = await pool.query(
      `SELECT u.email, u.phone, u.role, u.password_hash, u.pin_hash, w.balance_sen
       FROM users u JOIN wallets w ON w.user_id = u.id WHERE u.id = $1`,
      [res.body.userId],
    );
    const user = rows[0];
    expect(user.email).toBe('zakarya@email.com');
    expect(user.phone).toBe('+60123456789');
    expect(user.role).toBe('customer');
    expect(Number(user.balance_sen)).toBe(100_000);
    expect(user.password_hash).not.toContain('password12');
    expect(user.password_hash).toMatch(/^\$2b\$12\$/);
    expect(user.pin_hash).not.toBe('482913');
  });

  it('never sends the password or PIN back', async () => {
    const res = await register();
    expect(JSON.stringify(res.body)).not.toMatch(/password12|482913/);
  });
});

describe('POST /auth/register: input errors', () => {
  const cases: [string, Partial<typeof valid> | Record<string, unknown>, string][] = [
    ['missing name', { fullName: '' }, 'fullName'],
    ['bad email', { email: 'not-an-email' }, 'email'],
    ['non-Malaysian phone', { phone: '+44 7700 900123' }, 'phone'],
    ['phone too short', { phone: '01234' }, 'phone'],
    ['short password', { password: 'abc12' }, 'password'],
    ['password without a number', { password: 'passwordonly' }, 'password'],
    ['PIN not 6 digits', { pin: '1234' }, 'pin'],
    ['PIN with letters', { pin: '12ab56' }, 'pin'],
    ['weak PIN 111111', { pin: '111111' }, 'pin'],
    ['weak PIN 123456', { pin: '123456' }, 'pin'],
    ['weak PIN 654321', { pin: '654321' }, 'pin'],
    ['missing field', { email: undefined }, 'email'],
  ];

  it.each(cases)('rejects %s', async (_name, overrides, field) => {
    const res = await register(overrides);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation');
    expect(res.body.fields[field]).toEqual(expect.any(String));
  });

  it('creates nothing when the input is invalid', async () => {
    await register({ pin: '111111' });
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM users');
    expect(rows[0].n).toBe(0);
  });
});

describe('POST /auth/register: duplicates', () => {
  it('rejects a second account with the same email, without saying which field', async () => {
    await register();
    const res = await register({ phone: '019 888 1234' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('An account with these details already exists');
  });

  it('rejects a second account with the same phone in another format', async () => {
    await register();
    const res = await register({ email: 'other@email.com', phone: '+60123456789' });
    expect(res.status).toBe(409);
  });

  it('accepts a phone without the leading 0 and stores the same form (G2)', async () => {
    const res = await register({ phone: '12 345 6789' });
    expect(res.status).toBe(201);
    const { rows } = await pool.query('SELECT phone FROM users WHERE email = $1', [valid.email.toLowerCase()]);
    expect(rows[0].phone).toBe('+60123456789');
  });

  it('refuses the same phone without the 0, with the same generic message (G2)', async () => {
    await register();
    const res = await register({ email: 'other@email.com', phone: '123456789' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('An account with these details already exists');
  });
});

describe('helpers', () => {
  it('normalises Malaysian phone numbers', () => {
    expect(normalisePhone('012-345 6789')).toBe('+60123456789');
    expect(normalisePhone('+60 11 2345 6789')).toBe('+601123456789');
    expect(normalisePhone('12345')).toBeNull();
  });

  it('accepts the phone number with or without the leading 0 (G2)', () => {
    for (const form of ['0123456789', '123456789', '012 345 6789', '12-345 6789', '60123456789', '+60 12-345 6789']) {
      expect(normalisePhone(form)).toBe('+60123456789');
    }
    expect(normalisePhone('1112345678')).toBe('+601112345678');
    expect(normalisePhone('01112345678')).toBe('+601112345678');
  });

  it('rejects numbers that are too short, too long, not mobile or have letters (G2)', () => {
    for (const bad of ['12345678', '0012345678', '111234567890', '0312345678', '312345678', '12345678a', 'abc', '']) {
      expect(normalisePhone(bad)).toBeNull();
    }
  });

  it('spots weak PINs only', () => {
    expect(isWeakPin('000000')).toBe(true);
    expect(isWeakPin('345678')).toBe(true);
    expect(isWeakPin('987654')).toBe(true);
    expect(isWeakPin('482913')).toBe(false);
  });
});

describe('POST /auth/register: roles', () => {
  it('ignores "role": "admin" and always creates a customer', async () => {
    const res = await register({ role: 'admin' } as Partial<Record<keyof typeof valid, unknown>>);
    expect(res.status).toBe(201);
    const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [res.body.userId]);
    expect(rows[0].role).toBe('customer');
  });
});
