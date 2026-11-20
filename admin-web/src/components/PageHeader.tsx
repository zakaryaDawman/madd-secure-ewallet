import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

type Props = {
  title: string;
  eyebrow?: string; // small line above the title (default "MADD ADMIN")
  onBack?: { label: string; go: () => void }; // "< Flagged" on a detail page
  aside?: ReactNode; // e.g. a status badge on the right
  children?: ReactNode; // e.g. filter chips under the title
};

/** The dark navy band at the top of each admin page (designs 20, 21, 48). */
export function PageHeader({ title, eyebrow = 'MADD ADMIN', onBack, aside, children }: Props) {
  return (
    <header className={styles.header}>
      {onBack && (
        <button className={styles.back} onClick={onBack.go}>
          ‹ {onBack.label}
        </button>
      )}
      <div className={styles.topLine}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        {aside}
      </div>
      <h1 className={styles.title}>{title}</h1>
      {children}
    </header>
  );
}
