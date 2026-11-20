import bcrypt from 'bcrypt';
import { pool } from '../db/pool';
import { Device, listDevices } from './devices';
import { checkPin, PinCheck } from './pinCheck';
import { BCRYPT_ROUNDS } from './users';
import type { ChangePinInput } from '../validation/profile';

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  memberSince: string;
  devices: (Device & { thisDevice: boolean })[];
};

/** The logged-in user's details and devices. The device in the token is marked as "this phone". */
export async function getProfile(userId: number, deviceId: string): Promise<Profile | null> {
  const { rows } = await pool.query<{ full_name: string; email: string; phone: string; created_at: Date }>(
    'SELECT full_name, email, phone, created_at FROM users WHERE id = $1',
    [userId],
  );
  if (rows.length === 0) return null;
  const devices = await listDevices(userId);
  return {
    fullName: rows[0].full_name,
    email: rows[0].email,
    phone: rows[0].phone,
    memberSince: rows[0].created_at.toISOString(),
    devices: devices.map((d) => ({ ...d, thisDevice: d.deviceId === deviceId })),
  };
}

/** Changes the user's full name (the only detail they can edit themselves). */
export async function updateName(userId: number, fullName: string): Promise<void> {
  await pool.query('UPDATE users SET full_name = $2 WHERE id = $1', [userId, fullName]);
}

/** Changes the PIN if the current one is right. Wrong tries count towards the same lock as transfers. */
export async function changePin(userId: number, input: ChangePinInput): Promise<PinCheck> {
  const check = await checkPin(userId, input.currentPin);
  if (!check.ok) return check;
  const hash = await bcrypt.hash(input.newPin, BCRYPT_ROUNDS);
  await pool.query('UPDATE users SET pin_hash = $2 WHERE id = $1', [userId, hash]);
  return check;
}
