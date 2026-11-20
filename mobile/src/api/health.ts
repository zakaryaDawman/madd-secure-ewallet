import { apiGet } from './client';

/** Returns true if the MADD server and its database are both up. */
export async function checkServer(): Promise<boolean> {
  try {
    const body = await apiGet<{ ok: boolean }>('/health');
    return body.ok;
  } catch {
    return false;
  }
}
