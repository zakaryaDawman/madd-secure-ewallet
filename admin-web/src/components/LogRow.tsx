import type { LogEntry } from '../api/admin';
import { timeOfDay } from '../utils/time';
import styles from './LogRow.module.css';

/** One line of the Security log (design 22): time, coloured code · who, and what happened. Read-only. */
export function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <div className={styles.row}>
      <span className={styles.time}>{timeOfDay(entry.at)}</span>
      <div>
        <span className={`${styles.code} ${styles[entry.tone]}`}>{entry.code}</span> · {entry.name}
        <p className={styles.line}>{entry.line}</p>
      </div>
    </div>
  );
}
