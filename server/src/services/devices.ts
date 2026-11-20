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
