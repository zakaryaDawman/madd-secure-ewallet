import type { ReactNode } from 'react';
import { SideNav, type AdminPage } from './SideNav';
import styles from './AdminLayout.module.css';

type Props = { page: AdminPage; adminName: string; onSelect: (page: AdminPage) => void; onLogout: () => void; children: ReactNode };

/** Every admin page: the side menu on the left, the page on the right. */
export function AdminLayout({ page, adminName, onSelect, onLogout, children }: Props) {
  return (
    <div className={styles.layout}>
      <SideNav active={page} adminName={adminName} onSelect={onSelect} onLogout={onLogout} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
