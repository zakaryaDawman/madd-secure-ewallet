import { pool } from '../db/pool';
import { containsPattern } from '../utils/sqlLike';
import { lockedEmails } from './loginLock';
import { timeOfDayMY } from '../utils/time';

export type UserStatus = 'active' | 'frozen' | 'locked' | 'deactivated';
export const USER_FILTERS = ['all', 'frozen', 'locked'] as const;
export type UserFilter = (typeof USER_FILTERS)[number];

/** One row of the Users list (design 24). No email or phone here; they are on the detail page. */
export type UserListItem = { id: number; fullName: string; status: UserStatus; line: string };

export type UserList = { users: UserListItem[]; counts: { total: number; frozen: number; locked: number } };

type Row = { id: number; full_name: string; email: string; frozen_at: Date | null; deactivated_at: Date | null; frozen_by_admin: boolean; held: number; devices: number };

const LIST_LIMIT = 100;

/**
 * Customers for the Users list (design 24), searchable by name, email or phone (SQL-safe), filtered by status,
 * with the totals for "128 total", "Frozen · 2" and "Locked · 1". Admin accounts are not listed.
 */
export async function listUsers(search: string, filter: UserFilter): Promise<UserList> {
  const [{ rows }, locked] = await Promise.all([
    pool.query<Row>(
      `SELECT u.id, u.full_name, u.email, u.frozen_at, u.deactivated_at,
              COALESCE((SELECT e.details->>'source' = 'admin' FROM security_events e
                        WHERE e.user_id = u.id AND e.type = 'ACCOUNT_FROZEN' ORDER BY e.id DESC LIMIT 1), false) AS frozen_by_admin,
              (SELECT count(*) FROM transactions t WHERE t.sender_id = u.id AND t.status = 'PENDING' AND t.expires_at > now())::int AS held,
              (SELECT count(*) FROM known_devices d WHERE d.user_id = u.id)::int AS devices
       FROM users u
       WHERE u.role = 'customer' AND ($1 = '' OR u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1)
       ORDER BY u.full_name`,
      [search ? containsPattern(search) : ''],
    ),
    lockedEmails(),
  ]);
  const all = rows.map((r) => toItem(r, locked.get(r.email) ?? null));
  return {
    users: all.filter((u) => filter === 'all' || u.status === filter).slice(0, LIST_LIMIT),
    counts: { total: all.length, frozen: all.filter((u) => u.status === 'frozen').length, locked: all.filter((u) => u.status === 'locked').length },
  };
}

/** Status and the grey line under the name, e.g. "Deactivated · 9:15 PM", "Frozen by user · 9:15 PM", "Sign-in locked · 9 min left", "2 devices". */
function toItem(r: Row, unlocksAt: Date | null): UserListItem {
  const base = { id: r.id, fullName: r.full_name };
  if (r.deactivated_at) return { ...base, status: 'deactivated', line: `Deactivated · ${timeOfDayMY(r.deactivated_at)}` };
  if (r.frozen_at) return { ...base, status: 'frozen', line: `Frozen by ${r.frozen_by_admin ? 'admin' : 'user'} · ${timeOfDayMY(r.frozen_at)}` };
  if (unlocksAt) return { ...base, status: 'locked', line: `Sign-in locked · ${Math.ceil((unlocksAt.getTime() - Date.now()) / 60_000)} min left` };
  if (r.held > 0) return { ...base, status: 'active', line: `${r.held} held transfer${r.held === 1 ? '' : 's'}` };
  return { ...base, status: 'active', line: `${r.devices} device${r.devices === 1 ? '' : 's'}` };
}
