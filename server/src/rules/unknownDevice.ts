import type { RuleResult } from './ruleResult';

/** R3 Unknown device (FR-13). Fires when the device is not one of the user's trusted devices (new or not yet trusted). */
export function checkUnknownDevice(deviceId: string, trustedDeviceIds: string[]): RuleResult<UnknownDeviceDetails> {
  const details = { deviceId, trustedDevices: trustedDeviceIds.length };
  if (!trustedDeviceIds.includes(deviceId)) {
    return { fired: true, reason: 'This phone is not one of your trusted devices.', details };
  }
  return { fired: false, reason: 'This phone is a trusted device.', details };
}

/** What R3 looked at: the phone, and how many trusted phones the user has. */
export type UnknownDeviceDetails = { deviceId: string; trustedDevices: number };
