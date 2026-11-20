import { useEffect, useState } from 'react';
import { getFlaggedList, type FlaggedItem, type Rule } from '../api/admin';
import { ApiError } from '../api/client';
import { FilterChips } from '../components/FilterChips';
import { FlaggedCard } from '../components/FlaggedCard';
import { PageHeader } from '../components/PageHeader';
import styles from './FlaggedPage.module.css';

/** "Flagged activity" (design 21): every rule that fired, newest first, filtered by rule and pending. Click one to open it. */
export function FlaggedPage({ onOpen }: { onOpen: (id: number) => void }) {
  const [rule, setRule] = useState<Rule | null>(null);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [items, setItems] = useState<FlaggedItem[] | null>(null);
  const [error, setError] = useState('');

  // Load again whenever a filter changes.
  useEffect(() => {
    let current = true;
    getFlaggedList(rule, pendingOnly)
      .then((data) => {
        if (!current) return;
        setItems(data);
        setError('');
      })
      .catch((err) => current && setError(err instanceof ApiError ? err.message : 'Could not load flagged activity.'));
    return () => {
      current = false;
    };
  }, [rule, pendingOnly]);

  return (
    <>
      <PageHeader title="Flagged activity">
        <FilterChips rule={rule} pendingOnly={pendingOnly} onRule={setRule} onPendingOnly={setPendingOnly} />
      </PageHeader>
      <div className={styles.list}>
        {error && <p className={styles.error}>{error}</p>}
        {!items && !error && <p className={styles.status}>Loading…</p>}
        {items?.length === 0 && <p className={styles.status}>Nothing flagged for this filter.</p>}
        {items?.map((item) => (
          <FlaggedCard key={item.id} item={item} onOpen={() => onOpen(item.id)} />
        ))}
      </div>
    </>
  );
}
