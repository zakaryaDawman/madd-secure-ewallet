import styles from './StatCard.module.css';

type Props = { label: string; value: number; tone?: 'warning' | 'danger' };

/** One counter on the dashboard, e.g. "Held right now 3". The label is amber or red for the important ones (design 20). */
export function StatCard({ label, value, tone }: Props) {
  return (
    <div className={styles.card}>
      <p className={`${styles.label} ${tone ? styles[tone] : ''}`}>{label}</p>
      <p className={styles.value}>{value}</p>
    </div>
  );
}
