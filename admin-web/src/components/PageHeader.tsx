import styles from './PageHeader.module.css';

/** The dark navy band at the top of each admin page: "MADD ADMIN" and the page title (design 20). */
export function PageHeader({ title }: { title: string }) {
  return (
    <header className={styles.header}>
      <p className={styles.eyebrow}>MADD ADMIN</p>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}
