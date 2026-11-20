/** Server address. On a USB phone, adb reverse makes localhost reach the laptop. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** What every POST returns: the HTTP status and the parsed JSON body. */
export type ApiResult<T> = { ok: boolean; status: number; body: T };

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
