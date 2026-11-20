import { apiPost } from './client';
import { getDeviceId, getDeviceName } from '../auth/device';

export type RegisterData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  pin: string;
};

/** Field names the server can report an error for. */
export type RegisterField = keyof RegisterData | 'form';

export type RegisterResult =
  | { ok: true; userId: number }
  | { ok: false; errors: Partial<Record<RegisterField, string>> };

type ServerReply = { userId?: number; fields?: Record<string, string>; message?: string };

export type LoginResult =
  | { ok: true; token: string; fullName: string }
  | { ok: false; lockedSeconds: number } // too many wrong passwords: sign-in paused (design 27)
  | { ok: false; errors: { email?: string; password?: string; form?: string } };

type LoginReply = {
  token?: string;
  user?: { fullName: string };
  fields?: Record<string, string>;
  message?: string;
  error?: string;
  secondsLeft?: number;
};

/** Logs in on the server from this phone (sends its device id and name). Returns the session token, or messages to show under the fields / above the button. */
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const deviceId = await getDeviceId();
    const res = await apiPost<LoginReply>('/auth/login', { email, password, deviceId, deviceName: getDeviceName() });
    if (res.ok && res.body.token && res.body.user) return { ok: true, token: res.body.token, fullName: res.body.user.fullName };
    if (res.body.error === 'login_locked') return { ok: false, lockedSeconds: res.body.secondsLeft ?? 0 };
    if (res.body.fields) return { ok: false, errors: res.body.fields };
    return { ok: false, errors: { form: res.body.message ?? 'Something went wrong. Please try again.' } };
  } catch {
    return { ok: false, errors: { form: "Can't reach MADD. Check your connection and try again." } };
  }
}

/** Creates the account on the server. Returns the server's message for each wrong field, or one general message. */
export async function register(data: RegisterData): Promise<RegisterResult> {
  try {
    const res = await apiPost<ServerReply>('/auth/register', data);
    if (res.ok && res.body.userId) return { ok: true, userId: res.body.userId };
    if (res.body.fields) return { ok: false, errors: res.body.fields };
    return { ok: false, errors: { form: res.body.message ?? 'Something went wrong. Please try again.' } };
  } catch {
    return { ok: false, errors: { form: "Can't reach MADD. Check your connection and try again." } };
  }
}
