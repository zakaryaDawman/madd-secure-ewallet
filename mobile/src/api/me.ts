import { authGet, authPatch, authPost, OfflineError } from './client';

export type MyDevice = {
  deviceId: string;
  name: string;
  trusted: boolean;
  firstSeen: string;
  lastSeen: string;
  thisDevice: boolean;
};

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  memberSince: string;
  devices: MyDevice[];
};

/** What saving a change returns: ok, or the message to show. */
export type SaveResult = { ok: true } | { ok: false; message: string };

type ErrorReply = { fields?: Record<string, string>; message?: string };

/** Gets my details and my devices (this phone is marked by the server from the token). */
export function getProfile(): Promise<Profile> {
  return authGet<Profile>('/me');
}

/** Turns a server or connection problem into one message for the screen. */
function failure(body: ErrorReply | null): SaveResult {
  if (!body) return { ok: false, message: "Can't reach MADD. Check your connection." };
  const firstField = body.fields ? Object.values(body.fields)[0] : undefined;
  return { ok: false, message: firstField ?? body.message ?? 'Something went wrong. Please try again.' };
}

/** Saves a new full name. */
export async function saveName(fullName: string): Promise<SaveResult> {
  try {
    const res = await authPatch<ErrorReply>('/me', { fullName });
    return res.ok ? { ok: true } : failure(res.body);
  } catch (err) {
    if (err instanceof OfflineError) return failure(null);
    throw err;
  }
}

/** Changes the PIN. The server checks the current PIN; the phone decides nothing. */
export async function changePin(currentPin: string, newPin: string): Promise<SaveResult & { wrongPin?: boolean }> {
  try {
    const res = await authPost<ErrorReply & { error?: string }>('/me/pin', { currentPin, newPin });
    if (res.ok) return { ok: true };
    return { ...failure(res.body), wrongPin: res.body.error === 'wrong_pin' };
  } catch (err) {
    if (err instanceof OfflineError) return failure(null);
    throw err;
  }
}
