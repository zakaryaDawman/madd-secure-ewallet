import styles from './DetailRows.module.css';

export type DetailRow = { label: string; value: string; tone?: 'blue' | 'warning' | 'danger' };

/** The white label / value card on the detail page (design 48): User, To, Device, Severity. */
export function DetailRows({ rows }: { rows: DetailRow[] }) {
  return (
    <section className={styles.card}>
      {rows.map((row) => (
        <div key={row.label} className={styles.row}>
          <span className={styles.label}>{row.label}</span>
          <span className={`${styles.value} ${row.tone ? styles[row.tone] : ''}`}>{row.value}</span>
        </div>
      ))}
    </section>
  );
}
