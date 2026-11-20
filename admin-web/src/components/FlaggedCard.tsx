import type { FlaggedItem } from '../api/admin';
import { timeOfDay } from '../utils/time';
import { StatusBadge } from './StatusBadge';
import styles from './FlaggedCard.module.css';

/** One flagged event on the list (design 21): who, what fired, the facts and time, and its status. Click to open it. */
export function FlaggedCard({ item, onOpen }: { item: FlaggedItem; onOpen: () => void }) {
  return (
    <button className={styles.card} onClick={onOpen}>
      <div className={styles.top}>
        <p className={styles.name}>{item.userName}</p>
        <StatusBadge badge={item.badge} />
      </div>
      <p className={styles.summary}>{item.summary}</p>
      <p className={styles.facts}>{[...item.facts, timeOfDay(item.at)].join(' · ')}</p>
    </button>
  );
}
