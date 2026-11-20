import { ruleConfig } from '../rules/config';
import { formatRMFull } from '../utils/money';
import type { PushAlert } from './push';

/** "Was this you?" for a held transfer (designs 47 and 13). */
export function heldTransferAlert(amountSen: number): PushAlert {
  return { kind: 'TRANSFER_HELD', title: 'Was this you?', body: `${formatRMFull(amountSen)} transfer is waiting for you` };
}

/** "New login from Pixel 8. Was this you?" (design 13). */
export function newDeviceAlert(deviceName: string): PushAlert {
  return { kind: 'NEW_DEVICE', title: 'MADD · Security', body: `New login from ${deviceName}. Was this you?` };
}

/** Sign-in was locked after too many wrong passwords. */
export function loginLockedAlert(): PushAlert {
  return {
    kind: 'LOGIN_LOCKED',
    title: 'MADD · Security',
    body: `${ruleConfig.failedLoginMax} wrong password attempts. We locked sign-in for ${ruleConfig.lockMinutes} minutes.`,
  };
}
