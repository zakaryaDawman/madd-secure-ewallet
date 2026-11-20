import type { RuleCount } from '../api/admin';
import styles from './RuleBars.module.css';

/** What each rule watches for, as the dashboard names them. */
const RULE_NAMES: Record<RuleCount['rule'], string> = {
  R1: 'R1 Large amount',
  R2: 'R2 Velocity',
  R3: 'R3 New device',
  R4: 'R4 Failed logins',
};

/** "Alerts by rule" (design 20): one bar per rule for the last 7 days. The longest bar is the rule that fired most. */
export function RuleBars({ rules, total }: { rules: RuleCount[]; total: number }) {
  const most = Math.max(1, ...rules.map((r) => r.count));
  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Alerts by rule</h2>
        <span className={styles.note}>Last 7 days · {total} total</span>
      </div>
      {rules.map((r) => (
        <div key={r.rule} className={styles.row}>
          <span className={styles.name}>{RULE_NAMES[r.rule]}</span>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${(r.count / most) * 100}%` }} />
          </div>
          <span className={styles.count}>{r.count}</span>
        </div>
      ))}
    </section>
  );
}
