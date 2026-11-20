import type { UserListItem } from '../api/admin';
import { userBadge } from '../utils/userBadge';
import { Initials } from './Initials';
import { StatusBadge } from './StatusBadge';
import styles from './UserRow.module.css';

/** One customer on the Users list (design 24): initials, name, a short line, and Active / Frozen / Locked. */
export function UserRow({ user, onOpen }: { user: UserListItem; onOpen: () => void }) {
  return (
    <button className={styles.row} onClick={onOpen}>
      <Initials name={user.fullName} size={56} status={user.status} />
      <div className={styles.texts}>
        <p className={styles.name}>{user.fullName}</p>
        <p className={styles.line}>{user.line}</p>
      </div>
      <StatusBadge badge={userBadge(user.status)} />
    </button>
  );
}
