import type { UserFilter } from '../api/admin';
import styles from './FilterChips.module.css';

type Props = { filter: UserFilter; counts: { frozen: number; locked: number }; onChange: (filter: UserFilter) => void };

/** All / "Frozen · 2" / "Locked · 1" on the Users list (design 24). Same look as the Flagged chips. */
export function UserFilterChips({ filter, counts, onChange }: Props) {
  const options: { value: UserFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'frozen', label: `Frozen · ${counts.frozen}` },
    { value: 'locked', label: `Locked · ${counts.locked}` },
  ];
  return (
    <div className={styles.row}>
      {options.map((o) => (
        <button key={o.value} className={`${styles.chip} ${filter === o.value ? styles.selected : ''}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
