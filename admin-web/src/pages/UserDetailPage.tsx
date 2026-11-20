import { useCallback, useEffect, useState } from 'react';
import { freezeUser, getUser, trustDevice, unfreezeUser, type UserDetail } from '../api/admin';
import { ApiError } from '../api/client';
import { DeviceList } from '../components/DeviceList';
import { EventList } from '../components/EventList';
import { Initials } from '../components/Initials';
import { PageHeader } from '../components/PageHeader';
import { ReasonDialog } from '../components/ReasonDialog';
import { StatusBadge } from '../components/StatusBadge';
import { userBadge } from '../utils/userBadge';
import { formatRM } from '../utils/money';
import { dayHeading, timeOfDay } from '../utils/time';
import styles from './UserDetailPage.module.css';

type Device = UserDetail['devices'][number];
type Action = { kind: 'unfreeze' } | { kind: 'freeze' } | { kind: 'trust'; device: Device };

/**
 * One customer (design 23): contact, status, balance (read-only), devices with "Trust device", recent security events,
 * and Freeze / Unfreeze. Every action asks for a written reason (design 25) and is logged under this admin.
 */
export function UserDetailPage({ id, onBack }: { id: number; onBack: () => void }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [error, setError] = useState('');
  const [action, setAction] = useState<Action | null>(null);

  /** Loads (or reloads, after an action) the customer. */
  const load = useCallback(() => {
    getUser(id)
      .then(setUser)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this customer.'));
  }, [id]);

  useEffect(load, [load]);

  return (
    <>
      <PageHeader title={user?.fullName ?? 'Customer'} eyebrow="Customer" onBack={{ label: 'Users', go: onBack }}>
        {user && (
          <>
            <div className={styles.who}>
              <Initials name={user.fullName} size={72} strong />
              <p className={styles.contact}>
                {user.email} · {user.phone}
              </p>
            </div>
            <div className={styles.badges}>
              <StatusBadge badge={userBadge(user.status)} />
              <span className={styles.balance}>Balance {formatRM(user.balanceSen)}</span>
            </div>
          </>
        )}
      </PageHeader>
      <div className={styles.content}>
        {error && <p className={styles.error}>{error}</p>}
        {!user && !error && <p className={styles.status}>Loading…</p>}
        {user && (
          <>
            <p className={styles.section}>DEVICES</p>
            <DeviceList devices={user.devices} onTrust={(device) => setAction({ kind: 'trust', device })} />
            <p className={styles.section}>RECENT SECURITY EVENTS</p>
            <EventList events={user.events} />
            <p className={styles.note}>ⓘ Admins cannot move money, change balances or see PINs. Every admin action is written to the security log.</p>
            {user.status === 'frozen' ? (
              <button className={styles.unfreeze} onClick={() => setAction({ kind: 'unfreeze' })}>
                Unfreeze account
              </button>
            ) : (
              <button className={styles.freeze} onClick={() => setAction({ kind: 'freeze' })}>
                Freeze account
              </button>
            )}
          </>
        )}
      </div>
      {user && action && (
        <ReasonDialog
          {...dialogFor(user, action)}
          onDone={() => {
            setAction(null);
            load();
          }}
          onCancel={() => setAction(null)}
        />
      )}
    </>
  );
}

/** The title, facts, button and server call for each action's reason dialog. */
function dialogFor(user: UserDetail, action: Action) {
  if (action.kind === 'unfreeze') {
    const f = user.freeze;
    return {
      title: `Unfreeze ${user.fullName}?`,
      facts: f
        ? [
            { label: 'Frozen by', value: f.by },
            { label: 'Frozen at', value: f.at ? `${dayHeading(f.at)}, ${timeOfDay(f.at)}` : '—' },
            { label: 'Trigger', value: f.trigger },
          ]
        : [],
      confirmLabel: 'Unfreeze account',
      tone: 'primary' as const,
      onConfirm: (reason: string) => unfreezeUser(user.id, reason),
    };
  }
  if (action.kind === 'freeze') {
    return {
      title: `Freeze ${user.fullName}?`,
      facts: [{ label: 'What happens', value: 'Held transfers cancelled, every phone logged out' }],
      confirmLabel: 'Freeze account',
      tone: 'danger' as const,
      onConfirm: (reason: string) => freezeUser(user.id, reason),
    };
  }
  return {
    title: `Trust ${action.device.name}?`,
    facts: [{ label: 'What happens', value: 'Transfers from this phone are no longer held by R3' }],
    confirmLabel: 'Trust device',
    tone: 'primary' as const,
    onConfirm: (reason: string) => trustDevice(user.id, action.device.deviceId, reason),
  };
}
