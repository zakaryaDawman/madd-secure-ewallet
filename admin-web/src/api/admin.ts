import { api } from './client';

export type RuleCount = { rule: 'R1' | 'R2' | 'R3' | 'R4'; count: number };
export type EventTone = 'warning' | 'danger' | 'info';
export type LatestEvent = { id: number; name: string; text: string; tone: EventTone; at: string };

/** What GET /admin/stats returns: the dashboard numbers (design 20). */
export type AdminStats = {
  alertsToday: number;
  heldNow: number;
  frozenAccounts: number;
  lockedSignIns: number;
  byRule: RuleCount[];
  byRuleTotal: number;
  latest: LatestEvent[];
};

/** The logged-in admin's name, for the side menu. */
export function getAdminName(): Promise<{ fullName: string }> {
  return api('/admin/me');
}

/** The dashboard numbers. The server checks that the caller is an admin. */
export function getStats(): Promise<AdminStats> {
  return api('/admin/stats');
}

export type Rule = 'R1' | 'R2' | 'R3' | 'R4';
export type StatusTone = 'warning' | 'danger' | 'success' | 'muted';
export type StatusBadgeData = { status: string; label: string; tone: StatusTone };

/** One card on the Flagged list (design 21). */
export type FlaggedItem = { id: number; rule: Rule; userName: string; summary: string; facts: string[]; at: string; badge: StatusBadgeData };

/** One line of the detail timeline (design 48). */
export type TimelineStep = { label: string; at: string | null; state: 'done' | 'flag' | 'waiting' | 'bad' };

/** The read-only detail of one flagged event (design 48). */
export type FlaggedDetail = {
  id: number;
  rule: Rule;
  code: string;
  headline: string;
  badge: StatusBadgeData;
  userName: string;
  recipientName: string | null;
  device: string;
  severity: string;
  calculation: string;
  timeline: TimelineStep[];
};

/** The Flagged list, optionally only one rule and/or only pending transfers. */
export async function getFlaggedList(rule: Rule | null, pendingOnly: boolean): Promise<FlaggedItem[]> {
  const query = new URLSearchParams();
  if (rule) query.set('rule', rule);
  if (pendingOnly) query.set('status', 'pending');
  const body = await api<{ items: FlaggedItem[] }>(`/admin/flagged?${query}`);
  return body.items;
}

/** One flagged event with the exact calculation and timeline. */
export function getFlaggedDetail(id: number): Promise<FlaggedDetail> {
  return api(`/admin/flagged/${id}`);
}
