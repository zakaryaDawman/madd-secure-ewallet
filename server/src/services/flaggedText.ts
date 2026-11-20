import { formatRM, formatRMFull } from '../utils/money';
import type { FlaggedRow, Rule } from './flaggedRows';

/** The short name of each rule, as on the Flagged list (design 21). */
export const RULE_TITLES: Record<Rule, string> = { R1: 'R1 Large amount', R2: 'R2 Velocity', R3: 'R3 New device', R4: 'R4 Failed logins' };

/** The rule's code name, as in the detail header (design 48), e.g. "R1 LARGE_AMOUNT". */
export const RULE_CODES: Record<Rule, string> = { R1: 'R1 LARGE_AMOUNT', R2: 'R2 HIGH_VELOCITY', R3: 'R3 UNKNOWN_DEVICE', R4: 'R4 FAILED_LOGINS' };

export type FlaggedStatus = 'pending' | 'confirmed' | 'rejected' | 'expired' | 'locked' | 'lock_ended' | 'new_login';
export type StatusTone = 'warning' | 'danger' | 'success' | 'muted';

/** What the status badge says, and its colour, for each status. */
const STATUS_LOOK: Record<FlaggedStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  expired: { label: 'Expired', tone: 'muted' },
  locked: { label: 'Locked 15 min', tone: 'muted' },
  lock_ended: { label: 'Lock ended', tone: 'muted' },
  new_login: { label: 'New login', tone: 'muted' },
};

/**
 * Where a flagged event stands now. A held transfer: pending / confirmed / rejected / expired (a pending one whose
 * 5 minutes are over counts as expired). R4: whether sign-in is still locked. R3 at login: "New login".
 */
export function flaggedStatus(row: FlaggedRow, now: Date, signInLocked: boolean): { status: FlaggedStatus; label: string; tone: StatusTone } {
  const status = statusOf(row, now, signInLocked);
  return { status, ...STATUS_LOOK[status] };
}

/** The status key on its own (see flaggedStatus). */
function statusOf(row: FlaggedRow, now: Date, signInLocked: boolean): FlaggedStatus {
  if (row.rule === 'R4') return signInLocked ? 'locked' : 'lock_ended';
  if (row.transactionId === null) return 'new_login';
  if (row.transferStatus === 'PENDING') return row.expiresAt && row.expiresAt <= now ? 'expired' : 'pending';
  if (row.transferStatus === 'COMPLETED') return 'confirmed';
  if (row.transferStatus === 'CANCELLED') return 'rejected';
  return 'expired';
}

/** The main line of a list card, e.g. "R1 Large amount · RM 800.00 to Ahmad Ali". */
export function flaggedSummary(row: FlaggedRow): string {
  const d = row.details;
  const what = (() => {
    if (row.rule === 'R2' && d) return `${d.count} transfers ${spanText(Number(d.spanSeconds))}`;
    if (row.rule === 'R4' && d) return `${d.failures} attempts ${spanText(Number(d.spanSeconds))}`;
    if (row.rule === 'R3') return row.amountSen === null ? 'New login' : `Transfer ${formatRMFull(row.amountSen)} held`;
    if (row.amountSen !== null) return `${formatRMFull(row.amountSen)} to ${row.recipientName}`;
    return row.reason;
  })();
  return `${RULE_TITLES[row.rule]} · ${what}`;
}

/** The small grey facts under the summary, e.g. ["Usual transfer RM 96", "Pixel 8 (trusted)", "Account frozen"]. */
export function flaggedFacts(row: FlaggedRow): string[] {
  const facts: string[] = [];
  if (row.rule === 'R1' && row.details) {
    facts.push(row.details.averageSen === null ? 'New user, no past transfers' : `Usual transfer ${formatRM(Number(row.details.averageSen))}`);
  }
  facts.push(deviceLabel(row));
  if (row.userFrozen) facts.push('Account frozen');
  return facts;
}

/** The device as the admin sees it: "Pixel 8 (trusted)", "Oppo Reno 10 (untrusted)", or "Unknown device". */
export function deviceLabel(row: FlaggedRow): string {
  if (row.deviceName === null) return 'Unknown device';
  return `${row.deviceName} (${row.deviceTrusted ? 'trusted' : 'untrusted'})`;
}

/** The big title of the detail page (design 48), e.g. "RM 800.00 held". */
export function flaggedHeadline(row: FlaggedRow): string {
  if (row.amountSen !== null) return `${formatRMFull(row.amountSen)} held`;
  if (row.rule === 'R4') return 'Sign-in locked';
  return `New login${row.deviceName ? ` from ${row.deviceName}` : ''}`;
}

/**
 * "Why the rule fired" (design 48): the exact calculation, from the numbers the rule saved, e.g.
 * "Amount RM 800 > limit max(RM 500, 3 × average RM 96 = RM 288) = RM 500". Older alerts without numbers show their reason.
 */
export function flaggedCalculation(row: FlaggedRow): string {
  const d = row.details;
  if (!d) return row.reason;
  if (row.rule === 'R1') {
    const amount = formatRM(Number(d.amountSen));
    if (d.averageSen === null) return `Amount ${amount} > limit ${formatRM(Number(d.floorSen))} (no past transfers, so only the safe limit applies)`;
    const times = Number(d.multiplier) * Number(d.averageSen);
    return `Amount ${amount} > limit max(${formatRM(Number(d.floorSen))}, ${d.multiplier} × average ${formatRM(Number(d.averageSen))} = ${formatRM(times)}) = ${formatRM(Number(d.limitSen))}`;
  }
  if (row.rule === 'R2') return `${d.count} transfers ${spanText(Number(d.spanSeconds))} > ${d.maxTransfers} allowed in ${d.windowMinutes} minutes`;
  if (row.rule === 'R3') return `${row.deviceName ?? 'This device'} is not one of the user's ${d.trustedDevices} trusted device(s)`;
  return `${d.failures} wrong passwords ${spanText(Number(d.spanSeconds))} ≥ ${d.maxFailures} allowed in ${d.windowMinutes} minutes, so sign-in was locked`;
}

/** "in 3 minutes", or "in under a minute". */
function spanText(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes <= 1) return seconds < 60 ? 'in under a minute' : 'in 1 minute';
  return `in ${minutes} minutes`;
}
