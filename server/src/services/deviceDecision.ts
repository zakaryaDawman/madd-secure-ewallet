import { pool } from '../db/pool';
import { checkPin, PinCheck } from './pinCheck';
import { isTrustedDevice, markTrusted } from './devices';
import { freezeAccount } from './freeze';
import { logSecurityEvent } from './securityLog';

type Caller = { userId: number; deviceId: string };
export type DeviceDecisionError = 'needs_trusted_device' | 'not_found';
export type TrustResult = { ok: true } | { ok: false; error: DeviceDecisionError } | Exclude<PinCheck, { ok: true }>;

/**
 * "Trust this device" (design 45): from a trusted phone, with the PIN. Afterwards transfers from that phone are no longer
 * held by rule R3. Transfers already held still need their own "Yes".
 */
export async function trustDevice(caller: Caller, deviceId: string, pin: string): Promise<TrustResult> {
  if (!(await isTrustedDevice(caller.userId, caller.deviceId))) return { ok: false, error: 'needs_trusted_device' };
  const pinCheck = await checkPin(caller.userId, pin);
  if (!pinCheck.ok) return pinCheck;
  const name = await markTrusted(caller.userId, deviceId);
  if (!name) return { ok: false, error: 'not_found' };
  await logSecurityEvent({ userId: caller.userId, type: 'DEVICE_TRUSTED', reason: `The owner trusted ${name} with their PIN.` });
  return { ok: true };
}

/** "No, freeze my account" on the new device alert (design 13): from a trusted phone only. Freezes and logs out every phone. */
export async function rejectDevice(caller: Caller, deviceName: string): Promise<{ ok: boolean }> {
  if (!(await isTrustedDevice(caller.userId, caller.deviceId))) return { ok: false };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await freezeAccount(client, caller.userId, `The owner did not recognise ${deviceName}. Account frozen and every session ended.`);
    await client.query('COMMIT');
    return { ok: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
