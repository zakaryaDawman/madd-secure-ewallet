import { authGet, authPost, OfflineError } from './client';
import type { MyDevice } from './me';

export type PendingDevice = Omit<MyDevice, 'thisDevice'>;

export type DeviceActionResult = { ok: true } | { ok: false; reason: 'pin_locked' | 'other'; message: string };

const OFFLINE = "Can't reach MADD. Check your connection and try again.";

/** A new phone waiting for my decision, or null. The server only answers this on a trusted phone. */
export async function getPendingDevice(): Promise<PendingDevice | null> {
  const body = await authGet<{ device: PendingDevice | null }>('/me/devices/pending');
  return body.device;
}

/** "Trust this device" with my PIN (design 45). The server checks the PIN and that this phone is trusted. */
export async function trustDevice(deviceId: string, pin: string): Promise<DeviceActionResult> {
  return sendAction(`/me/devices/${deviceId}/trust`, { pin });
}

/** "No, freeze my account" on the new device alert (design 13). */
export async function rejectDevice(deviceId: string): Promise<DeviceActionResult> {
  return sendAction(`/me/devices/${deviceId}/reject`, {});
}

/** Posts a device decision and turns the reply into ok, or the message to show. */
async function sendAction(path: string, data: object): Promise<DeviceActionResult> {
  try {
    const res = await authPost<{ error?: string; message?: string }>(path, data);
    if (res.ok) return { ok: true };
    return { ok: false, reason: res.body.error === 'pin_locked' ? 'pin_locked' : 'other', message: res.body.message ?? 'Something went wrong. Please try again.' };
  } catch (err) {
    if (err instanceof OfflineError) return { ok: false, reason: 'other', message: OFFLINE };
    throw err;
  }
}
