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

export type LogTone = 'warning' | 'info' | 'danger' | 'plain';

/** One line of the Security log (design 22). */
export type LogEntry = { id: number; at: string; code: string; tone: LogTone; name: string; line: string };

/** One page of the log; `nextBefore` fetches the next older page (null at the end). */
export type LogPage = { entries: LogEntry[]; nextBefore: number | null };

/** The security log, newest first, 50 at a time, optionally searched by user or rule. */
export function getLogs(search: string, before: number | null): Promise<LogPage> {
  const query = new URLSearchParams();
  if (search) query.set('q', search);
  if (before !== null) query.set('before', String(before));
  return api(`/admin/logs?${query}`);
}

export type UserStatus = 'active' | 'frozen' | 'locked';
export type UserFilter = 'all' | 'frozen' | 'locked';

/** One row of the Users list (design 24). */
export type UserListItem = { id: number; fullName: string; status: UserStatus; line: string };
export type UserList = { users: UserListItem[]; counts: { total: number; frozen: number; locked: number } };

/** One customer's details (design 23). */
export type UserDetail = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  balanceSen: number;
  devices: { deviceId: string; name: string; trusted: boolean; firstSeen: string; lastSeen: string }[];
  events: { id: number; text: string; tone: EventTone; at: string }[];
  freeze: { by: string; at: string; trigger: string } | null;
};

/** The Users list, searched by name, email or phone, and filtered by status. */
export function getUsers(search: string, filter: UserFilter): Promise<UserList> {
  const query = new URLSearchParams({ filter });
  if (search) query.set('q', search);
  return api(`/admin/users?${query}`);
}

/** One customer's details. */
export function getUser(id: number): Promise<UserDetail> {
  return api(`/admin/users/${id}`);
}

/** The three admin actions. Each needs a written reason; the server logs it with this admin's name. */
export function unfreezeUser(id: number, reason: string): Promise<void> {
  return api(`/admin/users/${id}/unfreeze`, { method: 'POST', body: { reason } });
}

export function freezeUser(id: number, reason: string): Promise<void> {
  return api(`/admin/users/${id}/freeze`, { method: 'POST', body: { reason } });
}

export function trustDevice(id: number, deviceId: string, reason: string): Promise<void> {
  return api(`/admin/users/${id}/devices/${deviceId}/trust`, { method: 'POST', body: { reason } });
}
