import { useState } from 'react';
import { ApiError } from '../api/client';
import styles from './ReasonDialog.module.css';

const MIN_REASON = 10; // the server checks the same rule

type Props = {
  title: string; // e.g. "Unfreeze Lee Wei Ming?"
  facts: { label: string; value: string }[]; // e.g. Frozen by, Frozen at, Trigger
  confirmLabel: string;
  tone: 'primary' | 'danger';
  onConfirm: (reason: string) => Promise<void>;
  onDone: () => void;
  onCancel: () => void;
};

/**
 * The admin-action pop-up (design 25): the facts, a required written reason, and the note that both are saved to the
 * security log under this admin's account. Used for Unfreeze, Freeze and Trust device.
 */
export function ReasonDialog({ title, facts, confirmLabel, tone, onConfirm, onDone, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const longEnough = reason.trim().length >= MIN_REASON;

  /** Sends the action with the reason; the server checks the reason again and writes the log. */
  async function confirm() {
    setSending(true);
    setError('');
    try {
      await onConfirm(reason.trim());
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.dialog} role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        {facts.length > 0 && (
          <div className={styles.facts}>
            {facts.map((f) => (
              <div key={f.label} className={styles.fact}>
                <span className={styles.factLabel}>{f.label}</span>
                <span className={styles.factValue}>{f.value}</span>
              </div>
            ))}
          </div>
        )}
        <label className={styles.label} htmlFor="admin-reason">
          Reason (required)
        </label>
        <textarea id="admin-reason" className={styles.reason} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. User verified by phone call." />
        <p className={styles.note}>This action and your reason are saved to the security log under your admin account.</p>
        {error && <p className={styles.error}>{error}</p>}
        <button className={`${styles.confirm} ${styles[tone]}`} onClick={confirm} disabled={!longEnough || sending}>
          {sending ? 'Saving…' : confirmLabel}
        </button>
        <button className={styles.cancel} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
