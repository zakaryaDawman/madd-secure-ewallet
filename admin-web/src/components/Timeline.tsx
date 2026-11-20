import type { TimelineStep } from '../api/admin';
import { clockTime } from '../utils/time';
import styles from './Timeline.module.css';

/** The detail timeline (design 48): blue = done, amber = rule fired, red = bad outcome, hollow = still waiting. */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Timeline</h2>
      {steps.map((step) => (
        <div key={step.label} className={styles.step}>
          <span className={`${styles.dot} ${styles[step.state]}`} />
          <span className={`${styles.label} ${step.state === 'waiting' ? styles.waitingLabel : ''}`}>{step.label}</span>
          {step.at && <span className={styles.time}>{clockTime(step.at)}</span>}
        </div>
      ))}
    </section>
  );
}
