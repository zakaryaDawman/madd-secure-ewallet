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
  pinLocked: boolean; // design 30: freezing needs no PIN while it is locked
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
    return { ...failure(res.body), wrongPin: res.body.error === 'wrong_pin' || res.body.error === 'pin_locked' };
  } catch (err) {
    if (err instanceof OfflineError) return failure(null);
    throw err;
  }
}

/** Gives the server this phone's push token, so alerts can reach it once the phone is trusted. */
export async function savePushToken(token: string): Promise<void> {
  await authPost('/me/push-token', { token });
}

/** What freezing returned: frozen, or why not (PIN wrong / locked / needed) with the server's message. */
export type FreezeResult = { ok: true } | { ok: false; reason: 'pin_locked' | 'pin_required' | 'other'; message: string };

/**
 * "Freeze my account" (design 30, Inbox lock items). The server freezes and logs out every phone. The PIN is left out
 * while it is locked (or on a trusted phone from the Inbox); the server decides whether that is allowed.
 */
export async function freezeMyAccount(pin?: string): Promise<FreezeResult> {
  try {
    const res = await authPost<ErrorReply & { error?: string }>('/me/freeze', pin === undefined ? {} : { pin });
    if (res.ok) return { ok: true };
    const reason = res.body.error === 'pin_locked' || res.body.error === 'pin_required' ? res.body.error : 'other';
    return { ok: false, reason, message: failureMessage(res.body) };
  } catch (err) {
    if (err instanceof OfflineError) return { ok: false, reason: 'other', message: failureMessage(null) };
    throw err;
  }
}

/** The message to show for a failed request. */
function failureMessage(body: ErrorReply | null): string {
  const result = failure(body);
  return result.ok ? '' : result.message;
}
