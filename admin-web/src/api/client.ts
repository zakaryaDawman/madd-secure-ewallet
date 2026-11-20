import { API_URL } from '../config';
import { endSession, getToken } from './session';

/** A refused request, with the server's status and message (the page shows the message). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Calls the MADD server with the admin's token and returns the JSON reply.
 * A 401 (session expired, logged out, account frozen) ends the session here too, so the login page shows.
 */
export async function api<T>(path: string, init: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the MADD server.");
  }
  const body = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (res.status === 401 && token) endSession();
  if (!res.ok) throw new ApiError(res.status, body.message ?? 'Something went wrong.');
  return body;
}
