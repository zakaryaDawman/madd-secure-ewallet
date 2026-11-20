import { pool } from '../db/pool';
import { listTransactions, TransactionItem } from './transactions';

const RECENT_LIMIT = 3;

export type WalletSummary = {
  fullName: string;
  balanceSen: number;
  recent: TransactionItem[];
};

/** Returns the user's name, balance and their last 3 transactions (newest first). */
export async function getWalletSummary(userId: number): Promise<WalletSummary | null> {
  const wallet = await pool.query<{ full_name: string; balance_sen: string }>(
    `SELECT u.full_name, w.balance_sen
     FROM users u JOIN wallets w ON w.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  );
  if (wallet.rows.length === 0) return null;

  return {
    fullName: wallet.rows[0].full_name,
    balanceSen: Number(wallet.rows[0].balance_sen),
    recent: await listTransactions(userId, 'all', RECENT_LIMIT),
  };
}
