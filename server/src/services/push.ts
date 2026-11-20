import { cert, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { config } from '../config';
import { pool } from '../db/pool';

export type PushKind = 'TRANSFER_HELD' | 'NEW_DEVICE' | 'LOGIN_LOCKED';
export type PushAlert = { kind: PushKind; title: string; body: string };

/** Something that delivers one alert to some phone tokens and says whether it worked (Firebase, or a fake in tests). */
export type PushSender = (tokens: string[], alert: PushAlert) => Promise<boolean>;

// undefined = not decided yet; null = push is switched off (no Firebase key in .env).
let sender: PushSender | null | undefined;
const inFlight = new Set<Promise<void>>();

/**
 * Sends a push alert to the user's TRUSTED phones only (a new, untrusted phone never gets security alerts).
 * Runs in the background: the transfer or login that caused it never waits for Firebase and never fails because of it.
 * `eventAt` is when the event happened, so push_log can show how long the alert took.
 */
export function alertTrustedPhones(userId: number, alert: PushAlert, eventAt: Date = new Date()): void {
  const job = sendAndLog(userId, alert, eventAt).catch((err) => console.error('Push alert failed:', err));
  inFlight.add(job);
  void job.finally(() => inFlight.delete(job));
}

/** Waits until every background push has finished (used by the tests). */
export async function pushesSettled(): Promise<void> {
  await Promise.all([...inFlight]);
}

/** Replaces how pushes are delivered (tests use a fake instead of Firebase). */
export function setPushSender(fake: PushSender | null): void {
  sender = fake;
}

/** Finds the trusted phones' tokens, sends the alert, and writes the timing to push_log. */
async function sendAndLog(userId: number, alert: PushAlert, eventAt: Date): Promise<void> {
  const { rows } = await pool.query<{ push_token: string }>(
    'SELECT push_token FROM known_devices WHERE user_id = $1 AND trusted AND push_token IS NOT NULL',
    [userId],
  );
  if (rows.length === 0) return;
  const deliver = currentSender();
  const ok = deliver ? await deliver(rows.map((r) => r.push_token), alert).catch(() => false) : false;
  await pool.query('INSERT INTO push_log (user_id, kind, phones, ok, event_at) VALUES ($1, $2, $3, $4, $5)', [userId, alert.kind, rows.length, ok, eventAt]);
}

/** The sender to use: Firebase if its key is set in .env, otherwise none (push switched off, said once in the log). */
function currentSender(): PushSender | null {
  if (sender !== undefined) return sender;
  if (!config.firebaseServiceAccount) {
    console.warn('Push alerts are off: FIREBASE_SERVICE_ACCOUNT is not set in server/.env');
    sender = null;
  } else {
    sender = firebaseSender(config.firebaseServiceAccount);
  }
  return sender;
}

/** Delivers alerts through Firebase Cloud Messaging, on the phone's "security" channel with high priority. */
function firebaseSender(keyFile: string): PushSender {
  const messaging = getMessaging(initializeApp({ credential: cert(keyFile) }));
  return async (tokens, alert) => {
    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: alert.title, body: alert.body },
      android: { priority: 'high', notification: { channelId: 'security' } },
    });
    return result.successCount > 0;
  };
}
