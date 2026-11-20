import type { PoolClient } from 'pg';
import { pool } from '../db/pool';

export type Device = {
  deviceId: string;
  name: string;
  trusted: boolean;
  firstSeen: string;
  lastSeen: string;
};

/** Saves one login attempt (right or wrong). The account is found from the typed email, so failed tries on a real account are linked to it. */
export async function recordLoginAttempt(email: string, deviceId: string, success: boolean): Promise<void> {
  await pool.query(
    `INSERT INTO login_attempts (email, user_id, device_id, success)
     VALUES ($1, (SELECT id FROM users WHERE email = $1), $2, $3)`,
    [email, deviceId, success],
  );
}

/** Adds the device to the user's known devices, or updates its name and last-seen time. The user's very first device is trusted. */
export async function rememberDevice(userId: number, deviceId: string, name: string): Promise<void> {
  await pool.query(
    `INSERT INTO known_devices (user_id, device_id, name, trusted)
     VALUES ($1, $2, $3, NOT EXISTS (SELECT 1 FROM known_devices WHERE user_id = $1))
     ON CONFLICT (user_id, device_id) DO UPDATE SET name = EXCLUDED.name, last_seen = now()`,
    [userId, deviceId, name],
  );
}

/** The user's known devices, trusted first, then most recently seen. */
export async function listDevices(userId: number): Promise<Device[]> {
  const { rows } = await pool.query<{ device_id: string; name: string; trusted: boolean; first_seen: Date; last_seen: Date }>(
    `SELECT device_id, name, trusted, first_seen, last_seen FROM known_devices
     WHERE user_id = $1 ORDER BY trusted DESC, last_seen DESC`,
    [userId],
  );
  return rows.map((r) => ({
    deviceId: r.device_id,
    name: r.name,
    trusted: r.trusted,
    firstSeen: r.first_seen.toISOString(),
    lastSeen: r.last_seen.toISOString(),
  }));
}

/** Saves this phone's Firebase push token, so alerts can reach it once it is trusted. */
export async function savePushToken(userId: number, deviceId: string, token: string): Promise<boolean> {
  const { rowCount } = await pool.query('UPDATE known_devices SET push_token = $3 WHERE user_id = $1 AND device_id = $2', [userId, deviceId, token]);
  return rowCount === 1;
}

/** Ids of the user's trusted phones (rule R3 checks a device against this list). */
export async function trustedDeviceIds(userId: number, db: PoolClient | typeof pool = pool): Promise<string[]> {
  const { rows } = await db.query<{ device_id: string }>('SELECT device_id FROM known_devices WHERE user_id = $1 AND trusted', [userId]);
  return rows.map((r) => r.device_id);
}

/** True if this phone is one of the user's trusted devices. */
export async function isTrustedDevice(userId: number, deviceId: string): Promise<boolean> {
  return (await trustedDeviceIds(userId)).includes(deviceId);
}

/**
 * The newest phone that logged in during the last 24 hours and is not trusted yet, or null.
 * The trusted phone shows it in the "New device signed in" sheet (design 13).
 */
export async function pendingDevice(userId: number): Promise<Device | null> {
  const { rows } = await pool.query<{ device_id: string; name: string; trusted: boolean; first_seen: Date; last_seen: Date }>(
    `SELECT device_id, name, trusted, first_seen, last_seen FROM known_devices
     WHERE user_id = $1 AND NOT trusted AND last_seen > now() - interval '24 hours'
     ORDER BY last_seen DESC LIMIT 1`,
    [userId],
  );
  const r = rows[0];
  return r ? { deviceId: r.device_id, name: r.name, trusted: r.trusted, firstSeen: r.first_seen.toISOString(), lastSeen: r.last_seen.toISOString() } : null;
}

/** Marks one of the user's untrusted phones as trusted. Returns its name, or null if it isn't theirs or is already trusted. */
export async function markTrusted(userId: number, deviceId: string): Promise<string | null> {
  const { rows } = await pool.query<{ name: string }>(
    'UPDATE known_devices SET trusted = true WHERE user_id = $1 AND device_id = $2 AND NOT trusted RETURNING name',
    [userId, deviceId],
  );
  return rows[0]?.name ?? null;
}
