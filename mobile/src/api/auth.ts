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
  | { ok: true; token: string; fullName: string; role: 'customer' | 'admin' }
  | { ok: false; lockedSeconds: number } // too many wrong passwords: sign-in paused (design 27)
  | { ok: false; unverified: true } // right password, but the sign-up email code was never entered (task G4b)
  | { ok: false; errors: { email?: string; password?: string; form?: string } };

type LoginReply = {
  token?: string;
  user?: { fullName: string; role: 'customer' | 'admin' };
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
    if (res.ok && res.body.token && res.body.user) return { ok: true, token: res.body.token, fullName: res.body.user.fullName, role: res.body.user.role };
    if (res.body.error === 'login_locked') return { ok: false, lockedSeconds: res.body.secondsLeft ?? 0 };
    if (res.body.error === 'email_not_verified') return { ok: false, unverified: true };
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

/** Sends the sign-up code (task G4b). True when the email is now verified; otherwise the server's one general message. */
export async function verifyEmail(email: string, code: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await apiPost<{ verified?: boolean; message?: string }>('/auth/verify-email', { email, code });
    if (res.ok && res.body.verified) return { ok: true };
    return { ok: false, message: res.body.message ?? 'Something went wrong. Please try again.' };
  } catch {
    return { ok: false, message: "Can't reach MADD. Check your connection and try again." };
  }
}

/**
 * An admin-added customer accepts their invite (task G10) with the emailed code and their own password and PIN.
 * Returns the server's message for each wrong field, or one general message.
 */
export async function acceptInvite(email: string, code: string, password: string, pin: string): Promise<RegisterResult> {
  try {
    const res = await apiPost<{ accepted?: boolean; fields?: Record<string, string>; message?: string }>('/auth/accept-invite', { email, code, password, pin });
    if (res.ok && res.body.accepted) return { ok: true, userId: 0 };
    if (res.body.fields) return { ok: false, errors: res.body.fields };
    return { ok: false, errors: { form: res.body.message ?? 'Something went wrong. Please try again.' } };
  } catch {
    return { ok: false, errors: { form: "Can't reach MADD. Check your connection and try again." } };
  }
}

/** Asks for a new sign-up code (or invite code). The server gives the same reply whether or not it really sent one. */
export async function resendSignupCode(email: string, invite = false): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await apiPost<{ message?: string }>('/auth/resend-code', { email, invite });
    return { ok: res.ok, message: res.body.message };
  } catch {
    return { ok: false, message: "Can't reach MADD. Check your connection and try again." };
  }
}
