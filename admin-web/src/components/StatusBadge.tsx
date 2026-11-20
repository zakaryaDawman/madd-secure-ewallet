import type { StatusBadgeData } from '../api/admin';
import styles from './StatusBadge.module.css';

/** The coloured pill showing where a flagged event stands: Pending, Confirmed, Rejected, Expired, Locked 15 min… */
export function StatusBadge({ badge }: { badge: StatusBadgeData }) {
  return <span className={`${styles.badge} ${styles[badge.tone]}`}>{badge.label}</span>;
}
