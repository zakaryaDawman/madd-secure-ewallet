import { useCallback, useEffect, useState } from 'react';
import { getStats, type AdminStats } from '../api/admin';
import { ApiError } from '../api/client';
import { EventList } from '../components/EventList';
import { PageHeader } from '../components/PageHeader';
import { RuleBars } from '../components/RuleBars';
import { StatCard } from '../components/StatCard';
import styles from './DashboardPage.module.css';

const REFRESH_EVERY_MS = 15_000;

/** "Today at a glance" (design 20): 4 counters, alerts by rule for 7 days, latest events. Refreshes every 15 seconds. */
export function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  /** Asks the server for the latest numbers. */
  const load = useCallback(() => {
    getStats()
      .then((data) => {
        setStats(data);
        setError('');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load the dashboard.'));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_EVERY_MS);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <PageHeader title="Today at a glance" />
      <div className={styles.content}>
        {error && <p className={styles.error}>{error}</p>}
        {!stats && !error && <p className={styles.status}>Loading…</p>}
        {stats && (
          <>
            <div className={styles.counters}>
              <StatCard label="Alerts today" value={stats.alertsToday} />
              <StatCard label="Held right now" value={stats.heldNow} tone="warning" />
              <StatCard label="Frozen accounts" value={stats.frozenAccounts} tone="danger" />
              <StatCard label="Locked sign-ins" value={stats.lockedSignIns} />
            </div>
            <div className={styles.lower}>
              <RuleBars rules={stats.byRule} total={stats.byRuleTotal} />
              <EventList events={stats.latest} title="Latest events" />
            </div>
          </>
        )}
      </div>
    </>
  );
}
