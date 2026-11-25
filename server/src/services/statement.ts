import { pool } from '../db/pool';
import { maskName, maskPhone } from '../utils/mask';
import type { StatementQuery } from '../validation/statement';
import { makeReference } from './transfers';
import { expireHolds } from './holds';

const MAX_ROWS = 2000;

/** One line of the PDF statement. The other person's name is masked, like on receipts. */
export type StatementRow = {
  date: string;
  reference: string;
  direction: 'in' | 'out';
  otherName: string;
  note: string | null;
  status: string;
  amountSen: number;
};

/** Everything the phone needs to draw the statement (task G12). Totals count completed transfers only. No balance. */
export type Statement = {
  ownerName: string;
  ownerPhone: string; // masked
  from: string;
  to: string;
  filter: StatementQuery['filter'];
  totals: { inSen: number; outSen: number };
  rows: StatementRow[];
  truncated: boolean; // more than 2,000 rows: the PDF says to pick a shorter range
};

type Row = { id: number; direction: 'in' | 'out'; amount_sen: string; other_name: string; note: string | null; status: string; created_at: Date };

/**
 * My transactions between two Malaysian dates (both included), oldest first, for the PDF statement.
 * Uses the same "what can I see" rule as History: everything I sent, and money I received once it arrived.
 */
export async function getStatement(userId: number, query: StatementQuery): Promise<Statement> {
  await expireHolds(userId);
  const direction = query.filter === 'in' ? 'AND t.receiver_id = $1' : query.filter === 'out' ? 'AND t.sender_id = $1' : '';
  const [{ rows }, owner] = await Promise.all([
    pool.query<Row>(
      `SELECT t.id, CASE WHEN t.sender_id = $1 THEN 'out' ELSE 'in' END AS direction, t.amount_sen, other.full_name AS other_name,
              t.note, t.status, t.created_at
       FROM transactions t
       JOIN users other ON other.id = CASE WHEN t.sender_id = $1 THEN t.receiver_id ELSE t.sender_id END
       WHERE (t.sender_id = $1 OR (t.receiver_id = $1 AND t.status = 'COMPLETED')) ${direction}
         AND t.created_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')
         AND t.created_at < (($3::date + 1)::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')
       ORDER BY t.created_at, t.id LIMIT $4`,
      [userId, query.from, query.to, MAX_ROWS + 1],
    ),
    pool.query<{ full_name: string; phone: string }>('SELECT full_name, phone FROM users WHERE id = $1', [userId]),
  ]);
  const shown = rows.slice(0, MAX_ROWS);
  const completed = shown.filter((r) => r.status === 'COMPLETED');
  const sum = (dir: 'in' | 'out') => completed.filter((r) => r.direction === dir).reduce((total, r) => total + Number(r.amount_sen), 0);
  return {
    ownerName: owner.rows[0].full_name,
    ownerPhone: maskPhone(owner.rows[0].phone),
    from: query.from,
    to: query.to,
    filter: query.filter,
    totals: { inSen: sum('in'), outSen: sum('out') },
    rows: shown.map((r) => ({
      date: r.created_at.toISOString(),
      reference: makeReference(r.id, r.created_at),
      direction: r.direction,
      otherName: maskName(r.other_name),
      note: r.note,
      status: r.status,
      amountSen: Number(r.amount_sen),
    })),
    truncated: rows.length > MAX_ROWS,
  };
}
