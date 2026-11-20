import { pool } from '../db/pool';
import type { NotificationKind } from './notify';
import { notificationText } from './notificationText';
import { expireHolds, holdDetails } from './holds';
import { isTrustedDevice } from './devices';

export const INBOX_TABS = ['all', 'security'] as const;
export type InboxTab = (typeof INBOX_TABS)[number];

/** Which kinds each tab shows (designs 32 and 18). Held transfers waiting for a decision are the card on top of Security. */
const TAB_KINDS: Record<InboxTab, NotificationKind[]> = {
  all: ['MONEY_RECEIVED', 'MONEY_SENT', 'TRANSFER_HELD', 'WELCOME'],
  security: ['HOLD_CONFIRMED', 'NEW_DEVICE', 'LOGIN_LOCKED', 'PIN_LOCKED'],
};

export type InboxItem = {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  amountSen: number | null; // shown as + / - only for money received / sent
  otherName: string | null;
  createdAt: string;
  unread: boolean;
  canFreeze: boolean; // "Freeze my account" link on the lock items, only on a trusted phone
};

export type PendingCard = { transactionId: number; amountSen: number; otherName: string; reasons: string[]; secondsLeft: number; canDecide: boolean };

type Row = {
  id: number;
  kind: NotificationKind;
  read_at: Date | null;
  created_at: Date;
  amount_sen: string | null;
  status: string | null;
  other_name: string | null;
  device_name: string | null;
  device_trusted: boolean | null;
};

/** One tab of my Inbox, newest first, with the words built from each transfer or device as it is now. */
export async function listInbox(userId: number, deviceId: string, tab: InboxTab): Promise<InboxItem[]> {
  await expireHolds(userId);
  const [{ rows }, trusted] = await Promise.all([
    pool.query<Row>(
      `SELECT n.id, n.kind, n.read_at, n.created_at, t.amount_sen, t.status,
              CASE WHEN t.sender_id = $1 THEN receiver.full_name ELSE sender.full_name END AS other_name,
              d.name AS device_name, d.trusted AS device_trusted
       FROM notifications n
       LEFT JOIN transactions t ON t.id = n.transaction_id
       LEFT JOIN users sender ON sender.id = t.sender_id
       LEFT JOIN users receiver ON receiver.id = t.receiver_id
       LEFT JOIN known_devices d ON d.user_id = n.user_id AND d.device_id = n.device_id
       WHERE n.user_id = $1 AND n.kind = ANY($2)
       ORDER BY n.created_at DESC, n.id DESC LIMIT 100`,
      [userId, TAB_KINDS[tab]],
    ),
    isTrustedDevice(userId, deviceId),
  ]);
  return rows.map((r) => toItem(r, trusted));
}

/** Turns one database row into an Inbox item. */
function toItem(r: Row, viewerTrusted: boolean): InboxItem {
  const amountSen = r.amount_sen === null ? null : Number(r.amount_sen);
  const text = notificationText({
    kind: r.kind,
    amountSen,
    otherName: r.other_name,
    transferStatus: r.status,
    deviceName: r.device_name,
    deviceTrusted: r.device_trusted,
  });
  return {
    id: r.id,
    kind: r.kind,
    ...text,
    amountSen: r.kind === 'MONEY_RECEIVED' || r.kind === 'MONEY_SENT' ? amountSen : null,
    otherName: r.other_name,
    createdAt: r.created_at.toISOString(),
    unread: r.read_at === null,
    canFreeze: viewerTrusted && (r.kind === 'LOGIN_LOCKED' || r.kind === 'PIN_LOCKED'),
  };
}

/** My held transfers still waiting for a decision, for the card on top of Security (with Yes / No on a trusted phone). */
export async function pendingCards(userId: number, deviceId: string): Promise<PendingCard[]> {
  await expireHolds(userId);
  const [{ rows }, trusted] = await Promise.all([
    pool.query<{ id: number; amount_sen: string; other_name: string }>(
      `SELECT t.id, t.amount_sen, u.full_name AS other_name FROM transactions t JOIN users u ON u.id = t.receiver_id
       WHERE t.sender_id = $1 AND t.status = 'PENDING' ORDER BY t.created_at DESC`,
      [userId],
    ),
    isTrustedDevice(userId, deviceId),
  ]);
  return Promise.all(
    rows.map(async (r) => {
      const hold = await holdDetails(r.id, deviceId, trusted);
      return { transactionId: r.id, amountSen: Number(r.amount_sen), otherName: r.other_name, reasons: hold.reasons, secondsLeft: hold.secondsLeft, canDecide: hold.canDecide };
    }),
  );
}

/** How many unread items each tab has (for "Security · 3" and the red dot on the Inbox tab). */
export async function unreadCounts(userId: number): Promise<Record<InboxTab, number>> {
  const { rows } = await pool.query<{ all: number; security: number }>(
    `SELECT count(*) FILTER (WHERE kind = ANY($2))::int AS all, count(*) FILTER (WHERE kind = ANY($3))::int AS security
     FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
    [userId, TAB_KINDS.all, TAB_KINDS.security],
  );
  return rows[0];
}

/** Marks everything in one tab as read (when the user opens that tab). */
export async function markTabRead(userId: number, tab: InboxTab): Promise<void> {
  await pool.query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND kind = ANY($2) AND read_at IS NULL', [userId, TAB_KINDS[tab]]);
}
