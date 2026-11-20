import { formatRM } from '../utils/money';
import type { SecurityEventType } from './securityLog';

/** Colour of the dot next to an event on the dashboard: amber = paused, red = frozen/locked, blue = information. */
export type EventTone = 'warning' | 'danger' | 'info';

/** The facts the dashboard needs about one security_events row. */
export type EventFacts = { type: SecurityEventType; rule: string | null; amountSen: number | null };

/** Short wording and colour for one security event on the admin dashboard (design 20), e.g. "R1 held RM 800". Pure function. */
export function adminEventText(e: EventFacts): { text: string; tone: EventTone } {
  switch (e.type) {
    case 'RULE_FIRED':
      if (e.rule === 'R3') return { text: 'R3 new device', tone: 'info' };
      if (e.rule === 'R4') return { text: 'R4 sign-in locked', tone: 'danger' };
      return { text: `${e.rule} held ${e.amountSen === null ? 'a transfer' : formatRM(e.amountSen)}`, tone: 'warning' };
    case 'HOLD_CONFIRMED':
      return { text: 'Confirmed a held transfer', tone: 'info' };
    case 'HOLD_REJECTED':
      return { text: 'Rejected a held transfer', tone: 'danger' };
    case 'HOLD_EXPIRED':
      return { text: 'Held transfer expired', tone: 'info' };
    case 'ACCOUNT_FROZEN':
      return { text: 'Frozen by user', tone: 'danger' };
    case 'PIN_LOCKED':
      return { text: 'PIN locked', tone: 'danger' };
    case 'DEVICE_TRUSTED':
      return { text: 'Trusted a new device', tone: 'info' };
  }
}
