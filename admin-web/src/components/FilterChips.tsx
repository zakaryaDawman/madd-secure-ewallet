import type { Rule } from '../api/admin';
import styles from './FilterChips.module.css';

const RULES: Rule[] = ['R1', 'R2', 'R3', 'R4'];

type Props = { rule: Rule | null; pendingOnly: boolean; onRule: (rule: Rule | null) => void; onPendingOnly: (on: boolean) => void };

/** The filter chips on the Flagged list (design 21): All rules, R1–R4, and Pending (on/off). The selected ones are white. */
export function FilterChips({ rule, pendingOnly, onRule, onPendingOnly }: Props) {
  return (
    <div className={styles.row}>
      <button className={`${styles.chip} ${rule === null ? styles.selected : ''}`} onClick={() => onRule(null)}>
        All rules
      </button>
      {RULES.map((r) => (
        <button key={r} className={`${styles.chip} ${rule === r ? styles.selected : ''}`} onClick={() => onRule(r)}>
          {r}
        </button>
      ))}
      <button className={`${styles.chip} ${pendingOnly ? styles.selected : ''}`} onClick={() => onPendingOnly(!pendingOnly)}>
        Pending
      </button>
    </div>
  );
}
