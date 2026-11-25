import { pool } from '../db/pool';
import { adminEventText, type EventTone } from './adminEventText';
import { RULE_TITLES } from './flaggedText';
import type { Rule } from './flaggedRows';
import { lockedEmails } from './loginLock';
import type { SecurityEventType } from './securityLog';
import type { UserStatus } from './adminUserList';

/** Who froze the account and why, for the Unfreeze dialog (design 25). */
export type FreezeInfo = { by: string; at: string; trigger: string };

/** The User details page (design 23). Contact details are shown so support can verify the person; never PINs or hashes. */
export type UserDetail = {
  id: number;
  fullName: string;
  email: string;
  phone: string; // e.g. "+60 12-345 6789"
  status: UserStatus;
  balanceSen: number; // read-only: admins can't change it
  devices: { deviceId: string; name: string; trusted: boolean; firstSeen: string; lastSeen: string }[];
  events: { id: number; text: string; tone: EventTone; at: string }[];
  freeze: FreezeInfo | null;
};

/** "Frozen by" for each place a freeze can come from. */
const FROZEN_BY: Record<string, string> = {
  held_transfer: 'User (pressed No)',
  new_device_alert: 'User (new device alert)',
  freeze_my_account: 'User (Freeze my account)',
  admin: 'Admin',
};

/** One customer's details, or null if there is no such customer (admins are not shown here). */
export async function getUserDetail(userId: number): Promise<UserDetail | null> {
  const { rows } = await pool.query<{ id: number; full_name: string; email: string; phone: string; frozen_at: Date | null; deactivated_at: Date | null; balance_sen: string }>(
    `SELECT u.id, u.full_name, u.email, u.phone, u.frozen_at, u.deactivated_at, w.balance_sen
     FROM users u JOIN wallets w ON w.user_id = u.id WHERE u.id = $1 AND u.role = 'customer'`,
    [userId],
  );
  const user = rows[0];
  if (!user) return null;
  const [devices, events, freeze, locked] = await Promise.all([userDevices(userId), recentEvents(userId), user.frozen_at ? freezeInfo(userId) : null, lockedEmails()]);
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: formatPhone(user.phone),
    status: user.deactivated_at ? 'deactivated' : user.frozen_at ? 'frozen' : locked.has(user.email) ? 'locked' : 'active',
    balanceSen: Number(user.balance_sen),
    devices,
    events,
    freeze,
  };
}

/** The user's phones, trusted first (no push tokens). */
async function userDevices(userId: number): Promise<UserDetail['devices']> {
  const { rows } = await pool.query<{ device_id: string; name: string; trusted: boolean; first_seen: Date; last_seen: Date }>(
    'SELECT device_id, name, trusted, first_seen, last_seen FROM known_devices WHERE user_id = $1 ORDER BY trusted DESC, last_seen DESC',
    [userId],
  );
  return rows.map((d) => ({ deviceId: d.device_id, name: d.name, trusted: d.trusted, firstSeen: d.first_seen.toISOString(), lastSeen: d.last_seen.toISOString() }));
}

/** The user's 10 latest security events, worded like the dashboard ("R1 held RM 800"). */
async function recentEvents(userId: number): Promise<UserDetail['events']> {
  const { rows } = await pool.query<{ id: number; type: SecurityEventType; rule: string | null; amount_sen: string | null; created_at: Date }>(
    `SELECT e.id, e.type, e.rule, t.amount_sen, e.created_at FROM security_events e LEFT JOIN transactions t ON t.id = e.transaction_id
     WHERE e.user_id = $1 ORDER BY e.id DESC LIMIT 10`,
    [userId],
  );
  return rows.map((r) => ({ id: r.id, ...adminEventText({ type: r.type, rule: r.rule, amountSen: r.amount_sen === null ? null : Number(r.amount_sen) }), at: r.created_at.toISOString() }));
}

/** Who froze the account, when, and which rule led to it (from the latest freeze in the security log). */
async function freezeInfo(userId: number): Promise<FreezeInfo> {
  const { rows } = await pool.query<{ details: { source?: string; transactionId?: number } | null; created_at: Date; rule: Rule | null }>(
    `SELECT e.details, e.created_at,
            (SELECT r.rule FROM security_events r WHERE r.type = 'RULE_FIRED'
               AND r.transaction_id = (e.details->>'transactionId')::int ORDER BY r.id LIMIT 1) AS rule
     FROM security_events e WHERE e.user_id = $1 AND e.type = 'ACCOUNT_FROZEN' ORDER BY e.id DESC LIMIT 1`,
    [userId],
  );
  const last = rows[0];
  if (!last) return { by: 'Unknown', at: '', trigger: '—' };
  const source = last.details?.source ?? '';
  const trigger = last.rule ? RULE_TITLES[last.rule] : source === 'new_device_alert' ? RULE_TITLES.R3 : '—';
  return { by: FROZEN_BY[source] ?? 'Unknown', at: last.created_at.toISOString(), trigger };
}

/** "+60123456789" -> "+60 12-345 6789". */
function formatPhone(phone: string): string {
  const local = phone.replace(/^\+60/, '');
  return `+60 ${local.slice(0, 2)}-${local.slice(2, 5)} ${local.slice(5)}`;
}
