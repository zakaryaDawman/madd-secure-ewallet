import type { UserStatus } from '../api/admin';
import styles from './Initials.module.css';

type Props = { name: string; size: number; status?: UserStatus; strong?: boolean };

/** A round avatar with the person's initials, e.g. "ZD" (designs 23 and 24). Red when frozen, grey when locked. */
export function Initials({ name, size, status = 'active', strong = false }: Props) {
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const tone = strong ? styles.strong : status === 'frozen' ? styles.frozen : status === 'locked' ? styles.locked : '';
  return (
    <span className={`${styles.circle} ${tone}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </span>
  );
}
