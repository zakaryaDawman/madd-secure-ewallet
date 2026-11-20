import type { StatusBadgeData, UserStatus } from '../api/admin';

/** The badge for each user status (design 24). */
const BADGES: Record<UserStatus, StatusBadgeData> = {
  active: { status: 'active', label: 'Active', tone: 'success' },
  frozen: { status: 'frozen', label: 'Frozen', tone: 'danger' },
  locked: { status: 'locked', label: 'Locked', tone: 'muted' },
};

/** The status badge for a user (shared by the Users list and the User details page). */
export function userBadge(status: UserStatus): StatusBadgeData {
  return BADGES[status];
}
