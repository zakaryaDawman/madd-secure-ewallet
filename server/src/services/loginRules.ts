import { checkUnknownDevice } from '../rules/unknownDevice';
import { trustedDeviceIds } from './devices';
import { logSecurityEvent } from './securityLog';

/**
 * Rule R3 at login (FR-13): the login is allowed, but a phone that isn't trusted is logged in the security log.
 * Returns whether the phone is trusted.
 */
export async function checkNewDeviceLogin(userId: number, deviceId: string, deviceName: string): Promise<boolean> {
  const result = checkUnknownDevice(deviceId, await trustedDeviceIds(userId));
  if (result.fired) {
    await logSecurityEvent({ userId, type: 'RULE_FIRED', rule: 'R3', reason: `New login from ${deviceName}. ${result.reason}` });
  }
  return !result.fired;
}
