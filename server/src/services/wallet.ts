import { pool } from '../db/pool';

const RECENT_LIMIT = 3;

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
    recent: await getRecentTransactions(userId),
  };
}

/** Last few transfers the user sent or received, with the other person's name and whether money came in or went out. */
async function getRecentTransactions(userId: number): Promise<RecentTransaction[]> {
  const { rows } = await pool.query<{
    id: number;
    direction: 'in' | 'out';
    amount_sen: string;
    other_name: string;
    note: string | null;
    status: string;
    created_at: Date;
  }>(
    `SELECT t.id,
            CASE WHEN t.sender_id = $1 THEN 'out' ELSE 'in' END AS direction,
            t.amount_sen, other.full_name AS other_name, t.note, t.status, t.created_at
     FROM transactions t
     JOIN users other ON other.id = CASE WHEN t.sender_id = $1 THEN t.receiver_id ELSE t.sender_id END
     WHERE t.sender_id = $1 OR (t.receiver_id = $1 AND t.status = 'COMPLETED')
     ORDER BY t.created_at DESC
     LIMIT $2`,
    [userId, RECENT_LIMIT],
  );
  return rows.map((r) => ({
    id: r.id,
    direction: r.direction,
    amountSen: Number(r.amount_sen),
    otherName: r.other_name,
    note: r.note,
    status: r.status,
    createdAt: r.created_at.toISOString(),
  }));
}
