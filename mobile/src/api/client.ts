import { clearSession, getToken } from '../auth/session';
import { restartAt } from '../utils/navigation';

/** Server address. On a USB phone, adb reverse makes localhost reach the laptop. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** What every POST returns: the HTTP status and the parsed JSON body. */
export type ApiResult<T> = { ok: boolean; status: number; body: T };

/** Thrown when the phone can't reach the server (no internet, server off). Screens show the offline view. */
export class OfflineError extends Error {}

/**
 * Called when the server refuses the session token: forgets the token on the phone and shows "Your account is frozen"
 * (design 14) if the account was frozen, otherwise "You were logged out" (design 28).
 * Throws so the screen that asked stops what it was doing.
 */
async function endSession(res: Response): Promise<never> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  await clearSession();
  restartAt(body.error === 'account_frozen' ? '/frozen' : '/session-expired');
  throw new Error('Session ended');
}

/** Sends a GET request to the server and returns the JSON body. Throws if the server answers with an error. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

/** Sends JSON to the server and returns status + body, so screens can show the server's error messages. Throws only if the server can't be reached. */
export async function apiPost<T>(path: string, data: unknown): Promise<ApiResult<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, body };
}

/**
 * GET for logged-in screens that need the server's error messages: returns status + body.
 * If the server says the session is no longer valid, logs out on the phone and opens Session expired.
 * Throws OfflineError if the server can't be reached.
 */
export async function authGetResult<T>(path: string): Promise<ApiResult<T>> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token ?? ''}` } });
  } catch {
    throw new OfflineError();
  }
  if (res.status === 401) await endSession(res);
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, body };
}

/** Sends JSON with the session token (POST or PATCH) and returns status + body. Same 401 and offline handling as authGetResult. */
async function authSend<T>(method: 'POST' | 'PATCH', path: string, data: unknown): Promise<ApiResult<T>> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify(data),
    });
  } catch {
    throw new OfflineError();
  }
  if (res.status === 401) await endSession(res);
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, body };
}

/** POST for logged-in screens. */
export function authPost<T>(path: string, data: unknown): Promise<ApiResult<T>> {
  return authSend<T>('POST', path, data);
}

/** PATCH for logged-in screens (change part of a record, e.g. my name). */
export function authPatch<T>(path: string, data: unknown): Promise<ApiResult<T>> {
  return authSend<T>('PATCH', path, data);
}

/** GET for logged-in screens: sends the saved session token and returns the body. Throws on any error. */
export async function authGet<T>(path: string): Promise<T> {
  const res = await authGetResult<T>(path);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.body;
}

/** Tells the server to cancel this session (logout). Never throws: the phone forgets the token either way. */
export async function postLogout(): Promise<void> {
  const token = await getToken();
  if (!token) return;
  await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
}
