import { authGet } from './client';

export type RecentTransaction = {
  id: number;
  direction: 'in' | 'out';
  amountSen: number;
  otherName: string;
  note: string | null;
  status: string;
  createdAt: string;
};

export type WalletSummary = {
  fullName: string;
  balanceSen: number;
  recent: RecentTransaction[];
};

/** Gets the logged-in user's name, balance and last 3 transactions. */
export function getWallet(): Promise<WalletSummary> {
  return authGet<WalletSummary>('/wallet');
}
