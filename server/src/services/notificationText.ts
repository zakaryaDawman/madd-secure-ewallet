import { ruleConfig } from '../rules/config';
import { formatRMFull } from '../utils/money';
import type { NotificationKind } from './notify';

/** What one Inbox row knows about itself, read together with its transfer or device as they are now. */
export type NotificationFacts = {
  kind: NotificationKind;
  amountSen: number | null;
  otherName: string | null;
  transferStatus: string | null;
  deviceName: string | null;
  deviceTrusted: boolean | null;
};

/** The title and line shown for one Inbox item (designs 18 and 32). Pure function: same facts, same words. */
export function notificationText(f: NotificationFacts): { title: string; body: string } {
  const amount = f.amountSen === null ? '' : formatRMFull(f.amountSen);
  switch (f.kind) {
    case 'MONEY_RECEIVED':
      return { title: 'Money received', body: `From ${f.otherName}` };
    case 'MONEY_SENT':
      return { title: 'Money sent', body: `To ${f.otherName}` };
    case 'TRANSFER_HELD':
      if (f.transferStatus === 'PENDING') return { title: 'Transfer waiting for you', body: `${amount} to ${f.otherName}` };
      if (f.transferStatus === 'COMPLETED') return { title: 'Held transfer sent', body: `${amount} to ${f.otherName} was sent.` };
      return { title: 'Held transfer cancelled', body: `${amount} to ${f.otherName}. No money moved.` };
    case 'HOLD_CONFIRMED':
      return { title: 'You confirmed a held transfer', body: `${amount} to ${f.otherName} was sent.` };
    case 'NEW_DEVICE':
      return {
        title: 'New device signed in',
        body: `${f.deviceName}. ${f.deviceTrusted ? 'You trusted this device.' : 'Transfers from it are on hold until you trust it.'}`,
      };
    case 'LOGIN_LOCKED':
      return { title: `${ruleConfig.failedLoginMax} wrong password attempts`, body: `We locked sign-in for ${ruleConfig.lockMinutes} minutes. Not you?` };
    case 'PIN_LOCKED':
      return { title: `${ruleConfig.pinMaxTries} wrong PIN attempts`, body: `We locked transfers for ${ruleConfig.lockMinutes} minutes. Not you?` };
    case 'WELCOME':
      return { title: 'Welcome to MADD', body: 'RM 1,000 demo money added' };
  }
}
