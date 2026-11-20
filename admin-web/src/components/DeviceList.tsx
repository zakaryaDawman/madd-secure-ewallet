import type { UserDetail } from '../api/admin';
import { dayHeading, timeOfDay } from '../utils/time';
import styles from './DeviceList.module.css';

type Props = { devices: UserDetail['devices']; onTrust: (device: UserDetail['devices'][number]) => void };

/** The customer's phones (design 23): "Trusted", or a "Trust device" button for an untrusted one. */
export function DeviceList({ devices, onTrust }: Props) {
  return (
    <section className={styles.card}>
      {devices.length === 0 && <p className={styles.empty}>No devices yet.</p>}
      {devices.map((d) => (
        <div key={d.deviceId} className={styles.row}>
          <div>
            <p className={styles.name}>{d.name}</p>
            <p className={styles.when}>
              {d.trusted
                ? `First seen ${dayHeading(d.firstSeen).toLowerCase()}`
                : `Untrusted · ${dayHeading(d.lastSeen).toLowerCase()} ${timeOfDay(d.lastSeen)}`}
            </p>
          </div>
          {d.trusted ? (
            <span className={styles.trusted}>Trusted</span>
          ) : (
            <button className={styles.trust} onClick={() => onTrust(d)}>
              Trust device
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
