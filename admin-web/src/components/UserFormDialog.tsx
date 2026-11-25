import { useState } from 'react';
import type { UserDetails } from '../api/admin';
import { ApiError } from '../api/client';
import styles from './UserFormDialog.module.css';

const MIN_REASON = 10; // the server checks the same rule

type Props = {
  title: string; // "Add a customer" or "Edit Zakarya Dawman"
  initial: UserDetails;
  needsReason: boolean; // editing needs a written reason; adding doesn't
  confirmLabel: string;
  note: string;
  onConfirm: (details: UserDetails, reason: string) => Promise<void>;
  onDone: () => void;
  onCancel: () => void;
};

/** Pop-up for Add user and Edit user (task G10): name, email, phone, and a reason when editing. Styled like design 25. */
export function UserFormDialog({ title, initial, needsReason, confirmLabel, note, onConfirm, onDone, onCancel }: Props) {
  const [details, setDetails] = useState(initial);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const filled = details.fullName.trim() !== '' && details.email.trim() !== '' && details.phone.trim() !== '';
  const ready = filled && (!needsReason || reason.trim().length >= MIN_REASON);

  /** Updates one field as the admin types. */
  function change(field: keyof UserDetails, value: string) {
    setDetails((old) => ({ ...old, [field]: value }));
  }

  /** Sends the details; the server checks them again and shows its own message if they are refused. */
  async function confirm() {
    setSending(true);
    setError('');
    try {
      await onConfirm(details, reason.trim());
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
        <label className={styles.label}>
          Full name
          <input className={styles.input} value={details.fullName} onChange={(e) => change('fullName', e.target.value)} maxLength={80} />
        </label>
        <label className={styles.label}>
          Email
          <input className={styles.input} type="email" value={details.email} onChange={(e) => change('email', e.target.value)} />
        </label>
        <label className={styles.label}>
          Phone
          <input className={styles.input} value={details.phone} onChange={(e) => change('phone', e.target.value)} placeholder="012 345 6789" />
        </label>
        {needsReason && (
          <label className={styles.label}>
            Reason (required)
            <textarea className={styles.reason} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. Customer asked at the branch, ID checked." />
          </label>
        )}
        <p className={styles.note}>{note}</p>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.confirm} onClick={confirm} disabled={!ready || sending}>
          {sending ? 'Saving…' : confirmLabel}
        </button>
        <button className={styles.cancel} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
