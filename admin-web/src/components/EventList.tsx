import type { EventTone } from '../api/admin';
import { timeOfDay } from '../utils/time';
import styles from './EventList.module.css';

/** One event to show; `name` is left out on a user's own page (design 23). */
type ListEvent = { id: number; name?: string; text: string; tone: EventTone; at: string };

/** Security events (designs 20 and 23): coloured dot, who (if given), what happened, and when. Worded by the server. */
export function EventList({ events, title }: { events: ListEvent[]; title?: string }) {
  return (
    <section className={styles.card}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {events.length === 0 && <p className={styles.empty}>Nothing has happened yet.</p>}
      {events.map((e) => (
        <div key={e.id} className={styles.row}>
          <span className={`${styles.dot} ${styles[e.tone]}`} />
          <span className={styles.text}>
            {e.name && <span className={styles.name}>{e.name} · </span>}
            {e.text}
          </span>
          <span className={styles.time}>{timeOfDay(e.at)}</span>
        </div>
      ))}
    </section>
  );
}
