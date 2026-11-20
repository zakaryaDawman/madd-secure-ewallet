import { ruleConfig } from '../rules/config';
import { formatRM } from '../utils/money';
import { RULE_CODES } from './flaggedText';
import type { Rule } from './flaggedRows';
import type { SecurityEventType } from './securityLog';

/** Colour of the code on the Security log (design 22): amber = held, blue = information, red = locked/frozen, plain = the rest. */
export type LogTone = 'warning' | 'info' | 'danger' | 'plain';

/** What one security_events row says, for the log. */
export type LogFacts = { type: SecurityEventType; rule: Rule | null; reason: string; details: Record<string, number | string | null> | null };

/** The code shown in bold, e.g. "R1 LARGE_AMOUNT" for a rule, or the event type, e.g. "ACCOUNT_FROZEN". */
export function logCode(f: LogFacts): string {
  return f.type === 'RULE_FIRED' && f.rule ? RULE_CODES[f.rule] : f.type;
}

/** The colour of the code (design 22). */
export function logTone(f: LogFacts): LogTone {
  if (f.type === 'RULE_FIRED') return f.rule === 'R1' ? 'warning' : f.rule === 'R4' ? 'danger' : 'info';
  if (f.type === 'ACCOUNT_FROZEN' || f.type === 'HOLD_REJECTED' || f.type === 'PIN_LOCKED' || f.type === 'ADMIN_FREEZE') return 'danger';
  return 'plain';
}

/**
 * The one-line description (design 22). Rules with saved numbers show a compact calculation, e.g.
 * "RM 800 > max(RM 500, 3 × avg RM 96). Held."; everything else shows the reason saved with the event. Pure function.
 */
export function logLine(f: LogFacts): string {
  const d = f.details;
  if (f.type !== 'RULE_FIRED' || !d) return f.reason;
  if (f.rule === 'R1') {
    const amount = formatRM(Number(d.amountSen));
    const floor = formatRM(Number(d.floorSen));
    if (d.averageSen === null) return `${amount} > ${floor} safe limit (no past transfers). Held.`;
    return `${amount} > max(${floor}, ${d.multiplier} × avg ${formatRM(Number(d.averageSen))}). Held.`;
  }
  if (f.rule === 'R2') return `${d.count} transfers in ${minutes(Number(d.spanSeconds))} (limit ${d.maxTransfers} in ${d.windowMinutes} min). Held.`;
  if (f.rule === 'R4') return `${d.failures} failures in ${minutes(Number(d.spanSeconds))}. Login locked ${ruleConfig.lockMinutes} min.`;
  return f.reason;
}

/** "3 min", or "under 1 min". */
function minutes(seconds: number): string {
  return seconds < 60 ? 'under 1 min' : `${Math.ceil(seconds / 60)} min`;
}
