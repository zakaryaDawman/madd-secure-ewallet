/** Server address. On a USB phone, adb reverse makes localhost reach the laptop. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** Sends a GET request to the server and returns the JSON body. Throws if the server answers with an error. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}
