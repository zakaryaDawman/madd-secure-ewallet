import { Icon, type IconName } from './Icon';
import styles from './SideNav.module.css';

export type AdminPage = 'dashboard' | 'flagged' | 'logs' | 'users';

/** The four admin areas. Users arrives in task E4. */
const ITEMS: { page: AdminPage; label: string; icon: IconName; ready: boolean }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: 'dashboard', ready: true },
  { page: 'flagged', label: 'Flagged', icon: 'flag', ready: true },
  { page: 'logs', label: 'Logs', icon: 'logs', ready: true },
  { page: 'users', label: 'Users', icon: 'users', ready: false },
];

type Props = { active: AdminPage; adminName: string; onSelect: (page: AdminPage) => void; onLogout: () => void };

/** The dark side menu: the web version of the app's admin bottom bar (design 20), plus who is logged in and Log out. */
export function SideNav({ active, adminName, onSelect, onLogout }: Props) {
  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>MADD ADMIN</div>
      {ITEMS.map((item) => (
        <button
          key={item.page}
          className={`${styles.item} ${active === item.page ? styles.active : ''}`}
          disabled={!item.ready}
          onClick={() => onSelect(item.page)}
        >
          <Icon name={item.icon} />
          {item.label}
          {!item.ready && <span className={styles.soon}>soon</span>}
        </button>
      ))}
      <div className={styles.bottom}>
        <div className={styles.who}>Signed in as {adminName}</div>
        <button className={styles.item} onClick={onLogout}>
          <Icon name="logout" />
          Log out
        </button>
      </div>
    </nav>
  );
}
