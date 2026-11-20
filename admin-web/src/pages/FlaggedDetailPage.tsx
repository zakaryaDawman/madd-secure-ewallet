import { useEffect, useState } from 'react';
import { getFlaggedDetail, type FlaggedDetail } from '../api/admin';
import { ApiError } from '../api/client';
import { CalculationBox } from '../components/CalculationBox';
import { DetailRows, type DetailRow } from '../components/DetailRows';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import styles from './FlaggedDetailPage.module.css';

/**
 * One flagged event, read-only (design 48): who, to whom, device, severity, the exact calculation and the timeline.
 * There are no buttons on purpose: an admin can't approve or cancel a user's transfer.
 */
export function FlaggedDetailPage({ id, onBack }: { id: number; onBack: () => void }) {
  const [detail, setDetail] = useState<FlaggedDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getFlaggedDetail(id)
      .then(setDetail)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this event.'));
  }, [id]);

  return (
    <>
      <PageHeader
        title={detail?.headline ?? 'Flagged event'}
        eyebrow={detail ? `Event #${detail.id} · ${detail.code}` : `Event #${id}`}
        onBack={{ label: 'Flagged', go: onBack }}
        aside={detail && <StatusBadge badge={detail.badge} />}
      />
      <div className={styles.content}>
        {error && <p className={styles.error}>{error}</p>}
        {!detail && !error && <p className={styles.status}>Loading…</p>}
        {detail && (
          <>
            <DetailRows rows={rowsFor(detail)} />
            <CalculationBox calculation={detail.calculation} />
            <Timeline steps={detail.timeline} />
            <p className={styles.note}>Read-only. Admins can&apos;t approve or cancel a user&apos;s transfer.</p>
          </>
        )}
      </div>
    </>
  );
}

/** The User / To / Device / Severity rows (To only when there was a transfer). */
function rowsFor(detail: FlaggedDetail): DetailRow[] {
  return [
    { label: 'User', value: detail.userName, tone: 'blue' },
    ...(detail.recipientName ? [{ label: 'To', value: detail.recipientName }] : []),
    { label: 'Device', value: detail.device },
    { label: 'Severity', value: detail.severity, tone: detail.severity === 'High' ? 'danger' : 'warning' },
  ];
}
