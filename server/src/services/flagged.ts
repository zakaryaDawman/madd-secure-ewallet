import { ruleConfig } from '../rules/config';
import { currentLoginLock } from './loginLock';
import { flaggedRow, flaggedRows, type FlaggedRow, type Rule } from './flaggedRows';
import {
  deviceLabel, flaggedCalculation, flaggedFacts, flaggedHeadline, flaggedStatus, flaggedSummary,
  RULE_CODES, type FlaggedStatus, type StatusTone,
} from './flaggedText';
import { buildTimeline, timelineFacts, type TimelineStep } from './flaggedTimeline';

export const STATUS_FILTERS = ['pending', 'confirmed', 'rejected', 'expired', 'locked'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

type StatusBadge = { status: FlaggedStatus; label: string; tone: StatusTone };

/** One card on the Flagged list (design 21). Read-only, no email, phone or secrets. */
export type FlaggedItem = { id: number; rule: Rule; userName: string; summary: string; facts: string[]; at: string; badge: StatusBadge };

/** The read-only detail page (design 48). */
export type FlaggedDetail = {
  id: number;
  rule: Rule;
  code: string;
  headline: string;
  badge: StatusBadge;
  userName: string;
  recipientName: string | null;
  device: string;
  severity: string;
  calculation: string;
  timeline: TimelineStep[];
};

/** Every rule that fired, newest first, narrowed by rule and/or status (FR-18). */
export async function listFlagged(rule: Rule | null, status: StatusFilter | null): Promise<FlaggedItem[]> {
  const rows = await flaggedRows(rule);
  const items = await Promise.all(rows.map(async (row) => ({ row, badge: await badgeFor(row) })));
  return items
    .filter(({ badge }) => status === null || badge.status === status)
    .map(({ row, badge }) => ({
      id: row.eventId,
      rule: row.rule,
      userName: row.userName,
      summary: flaggedSummary(row),
      facts: flaggedFacts(row),
      at: row.flaggedAt.toISOString(),
      badge,
    }));
}

/** One flagged event with the exact calculation and timeline, or null if there is no such alert. */
export async function getFlagged(eventId: number): Promise<FlaggedDetail | null> {
  const row = await flaggedRow(eventId);
  if (!row) return null;
  const badge = await badgeFor(row);
  return {
    id: row.eventId,
    rule: row.rule,
    code: RULE_CODES[row.rule],
    headline: flaggedHeadline(row),
    badge,
    userName: row.userName,
    recipientName: row.recipientName,
    device: deviceLabel(row),
    severity: ruleConfig.severity[row.rule],
    calculation: flaggedCalculation(row),
    timeline: buildTimeline(row, badge.status, await timelineFacts(row)),
  };
}

/** The status badge, checking the live sign-in lock for R4 (the same lock rule as the login). */
async function badgeFor(row: FlaggedRow): Promise<StatusBadge> {
  const signInLocked = row.rule === 'R4' && (await currentLoginLock(row.userEmail)).locked;
  return flaggedStatus(row, new Date(), signInLocked);
}
