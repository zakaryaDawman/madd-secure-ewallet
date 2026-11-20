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
