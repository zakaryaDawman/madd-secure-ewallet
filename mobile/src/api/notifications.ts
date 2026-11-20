import { authGet, authPost } from './client';

export type InboxTab = 'all' | 'security';

export type InboxItem = {
  id: number;
  kind: 'MONEY_RECEIVED' | 'MONEY_SENT' | 'TRANSFER_HELD' | 'HOLD_CONFIRMED' | 'NEW_DEVICE' | 'LOGIN_LOCKED' | 'PIN_LOCKED' | 'WELCOME';
  title: string;
  body: string;
  amountSen: number | null;
  otherName: string | null;
  createdAt: string;
  unread: boolean;
  canFreeze: boolean;
};

/** A held transfer waiting for my decision, shown as the card on top of Security (design 18). */
export type PendingCard = { transactionId: number; amountSen: number; otherName: string; reasons: string[]; secondsLeft: number; canDecide: boolean };

export type UnreadCounts = Record<InboxTab, number>;

export type InboxPage = { items: InboxItem[]; pending: PendingCard[]; unread: UnreadCounts };

/** One Inbox tab, as the server words it (the phone only shows it). */
export function getInbox(tab: InboxTab): Promise<InboxPage> {
  return authGet<InboxPage>(`/notifications?tab=${tab}`);
}

/** How many unread items each tab has, for the red dot on the Inbox tab. */
export function getUnreadCounts(): Promise<UnreadCounts> {
  return authGet<UnreadCounts>('/notifications/unread');
}

/** Tells the server I opened this tab, so its items stop counting as unread. */
export async function markTabRead(tab: InboxTab): Promise<void> {
  await authPost('/notifications/read', { tab });
}

