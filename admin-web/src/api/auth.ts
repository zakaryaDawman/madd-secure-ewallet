import { api } from './client';

const DEVICE_KEY = 'madd-admin-device-id';

type LoginReply = { token: string; user: { fullName: string; role: 'customer' | 'admin' } };

/**
 * Logs in with the same /auth/login as the phone app (same sign-in lock, same sessions).
 * The server checks the password; this page only sends it once and never stores it.
 */
export function login(email: string, password: string): Promise<LoginReply> {
  return api<LoginReply>('/auth/login', { method: 'POST', body: { email, password, deviceId: consoleDeviceId(), deviceName: 'MADD admin console' } });
}

/** Ends this session on the server, so the token stops working at once. */
export async function logout(): Promise<void> {
  await api('/auth/logout', { method: 'POST', body: {} });
}

/**
 * A random id for this browser, kept so each login is "the same device" (otherwise every login would look like
 * a new device to rule R3). It is not secret: it identifies the browser, it doesn't log anyone in.
 */
function consoleDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}
