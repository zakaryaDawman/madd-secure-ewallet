import { clearSession, getToken } from '../auth/session';
import { replaceScreen } from '../utils/navigation';

/** Server address. On a USB phone, adb reverse makes localhost reach the laptop. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** What every POST returns: the HTTP status and the parsed JSON body. */
export type ApiResult<T> = { ok: boolean; status: number; body: T };

/** Thrown when the phone can't reach the server (no internet, server off). Screens show the offline view. */
export class OfflineError extends Error {}

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
 * If the server says the session is no longer valid, logs out on the phone and opens Login.
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
  if (res.status === 401) {
    await clearSession();
    replaceScreen('/login');
    throw new Error('Session ended');
  }
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, body };
}

/** POST for logged-in screens: sends JSON with the session token and returns status + body. Same 401 and offline handling as authGetResult. */
export async function authPost<T>(path: string, data: unknown): Promise<ApiResult<T>> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify(data),
    });
  } catch {
    throw new OfflineError();
  }
  if (res.status === 401) {
    await clearSession();
    replaceScreen('/login');
    throw new Error('Session ended');
  }
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, body };
}

/** GET for logged-in screens: sends the saved session token and returns the body. Throws on any error. */
export async function authGet<T>(path: string): Promise<T> {
  const res = await authGetResult<T>(path);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.body;
}
