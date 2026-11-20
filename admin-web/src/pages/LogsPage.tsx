import { Fragment, useCallback, useEffect, useState } from 'react';
import { getLogs, type LogEntry } from '../api/admin';
import { ApiError } from '../api/client';
import { LogRow } from '../components/LogRow';
import { PageHeader } from '../components/PageHeader';
import { SearchBox } from '../components/SearchBox';
import { dayHeading } from '../utils/time';
import styles from './LogsPage.module.css';

/**
 * "Security log" (design 22): every security event, newest first, searchable by user or rule, 50 at a time.
 * Read-only: the console has no way to change it, and the database refuses any edit or delete.
 */
export function LogsPage() {
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // A new search starts again from the newest entry.
  useEffect(() => {
    let current = true;
    getLogs(search, null)
      .then((page) => {
        if (!current) return;
        setEntries(page.entries);
        setNextBefore(page.nextBefore);
        setError('');
      })
      .catch((err) => current && setError(err instanceof ApiError ? err.message : 'Could not load the log.'));
    return () => {
      current = false;
    };
  }, [search]);

  /** "Load older": adds the next 50 older entries under the current ones. */
  const loadOlder = useCallback(async () => {
    if (nextBefore === null) return;
    setLoadingMore(true);
    try {
      const page = await getLogs(search, nextBefore);
      setEntries((shown) => [...(shown ?? []), ...page.entries]);
      setNextBefore(page.nextBefore);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load more.');
    } finally {
      setLoadingMore(false);
    }
  }, [search, nextBefore]);

  return (
    <>
      <PageHeader title="Security log" aside={<span className={styles.readOnly}>Read-only</span>}>
        <SearchBox placeholder="Search by user or rule" onSearch={setSearch} />
      </PageHeader>
      <div className={styles.list}>
        {error && <p className={styles.error}>{error}</p>}
        {!entries && !error && <p className={styles.status}>Loading…</p>}
        {entries?.length === 0 && <p className={styles.status}>Nothing in the log matches this search.</p>}
        {entries?.map((entry, i) => {
          const heading = dayHeading(entry.at);
          const newDay = i === 0 || heading !== dayHeading(entries[i - 1].at);
          return (
            <Fragment key={entry.id}>
              {newDay && <p className={styles.day}>{heading}</p>}
              <LogRow entry={entry} />
            </Fragment>
          );
        })}
        {nextBefore !== null && (
          <button className={styles.more} onClick={loadOlder} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load older'}
          </button>
        )}
      </div>
    </>
  );
}
