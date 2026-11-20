import { authGet, authGetResult } from './client';
import type { RecentTransaction } from './wallet';

export type TransactionFilter = 'all' | 'in' | 'out' | 'held';

/** Why a transfer was paused and how long the owner has left to decide (design 11). */
export type HoldDetails = { reasons: string[]; expiresAt: string; secondsLeft: number; thisDevice: boolean; canDecide: boolean };

export type TransactionDetail = RecentTransaction & {
  otherNameMasked: string;
  otherPhone: string;
  reference: string;
  completedAt: string | null;
  sentFrom: { name: string; thisDevice: boolean } | null;
  hold: HoldDetails | null;
};

/** Gets the logged-in user's transactions, newest first, for one History filter. */
export async function getTransactions(filter: TransactionFilter): Promise<RecentTransaction[]> {
  const body = await authGet<{ transactions: RecentTransaction[] }>(`/transactions?filter=${filter}`);
  return body.transactions;
}

/** Gets one of the user's transactions, or null if the server says it isn't theirs (404). */
export async function getTransaction(id: number): Promise<TransactionDetail | null> {
  const res = await authGetResult<TransactionDetail>(`/transactions/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.body;
}
