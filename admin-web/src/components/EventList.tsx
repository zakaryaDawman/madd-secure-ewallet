import type { LatestEvent } from '../api/admin';
import { timeOfDay } from '../utils/time';
import styles from './EventList.module.css';

/** The latest security events (design 20): coloured dot, short name, what happened, and when. Worded by the server. */
export function EventList({ events }: { events: LatestEvent[] }) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Latest events</h2>
      {events.length === 0 && <p className={styles.empty}>Nothing has happened yet.</p>}
      {events.map((e) => (
        <div key={e.id} className={styles.row}>
          <span className={`${styles.dot} ${styles[e.tone]}`} />
          <span className={styles.text}>
            <span className={styles.name}>{e.name}</span> · {e.text}
          </span>
          <span className={styles.time}>{timeOfDay(e.at)}</span>
        </div>
      ))}
    </section>
  );
}
