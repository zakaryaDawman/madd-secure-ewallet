import { checkUnknownDevice } from '../rules/unknownDevice';
import { trustedDeviceIds } from './devices';
import { logSecurityEvent } from './securityLog';
import { notify } from './notify';
import { alertTrustedPhones } from './push';
import { newDeviceAlert } from './pushAlerts';

/**
 * Rule R3 at login (FR-13): the login is allowed, but a phone that isn't trusted is logged in the security log
 * shown in the Inbox as "New device signed in", and pushed to the trusted phones (design 13).
 * Returns whether the phone is trusted.
 */
export async function checkNewDeviceLogin(userId: number, deviceId: string, deviceName: string): Promise<boolean> {
  const result = checkUnknownDevice(deviceId, await trustedDeviceIds(userId));
  if (result.fired) {
    await logSecurityEvent({ userId, type: 'RULE_FIRED', rule: 'R3', reason: `New login from ${deviceName}. ${result.reason}` });
    await notify({ userId, kind: 'NEW_DEVICE', deviceId });
    alertTrustedPhones(userId, newDeviceAlert(deviceName));
  }
  return !result.fired;
}
