import type { PoolClient } from 'pg';
import { ruleConfig } from '../rules/config';
import { checkLargeAmount } from '../rules/largeAmount';
import { checkVelocity } from '../rules/velocity';

/** One rule that fired for a transfer, e.g. { rule: 'R1', reason: 'RM 800 is more than…' }. */
export type FiredRule = { rule: 'R1' | 'R2'; reason: string };

/**
 * Runs R1 (large amount) and R2 (velocity) on a new transfer and returns the ones that fired.
 * Reads the data the rules need, then lets the pure rule functions decide. Runs inside the transfer's database transaction.
 */
export async function runTransferRules(client: PoolClient, senderId: number, amountSen: number): Promise<FiredRule[]> {
  const [pastAmounts, recentTimes, now] = await Promise.all([
    pastCompletedAmounts(client, senderId),
    recentTransferTimes(client, senderId),
    databaseNow(client),
  ]);
  const results = [
    { rule: 'R1' as const, ...checkLargeAmount(amountSen, pastAmounts) },
    { rule: 'R2' as const, ...checkVelocity(recentTimes, now) },
  ];
  return results.filter((r) => r.fired).map(({ rule, reason }) => ({ rule, reason }));
}

/** Amounts of the user's completed transfers: R1 works out their "usual" transfer from these. */
async function pastCompletedAmounts(client: PoolClient, senderId: number): Promise<number[]> {
  const { rows } = await client.query<{ amount_sen: string }>(
    "SELECT amount_sen FROM transactions WHERE sender_id = $1 AND status = 'COMPLETED'",
    [senderId],
  );
  return rows.map((r) => Number(r.amount_sen));
}

/** Times of every transfer the user started in the last few minutes, held ones too, so R2 can't be dodged. */
async function recentTransferTimes(client: PoolClient, senderId: number): Promise<Date[]> {
  const { rows } = await client.query<{ created_at: Date }>(
    'SELECT created_at FROM transactions WHERE sender_id = $1 AND created_at > now() - make_interval(mins => $2)',
    [senderId, ruleConfig.velocityWindowMinutes],
  );
  return rows.map((r) => r.created_at);
}

/** The database's clock, so the rules and the saved times always agree. */
async function databaseNow(client: PoolClient): Promise<Date> {
  const { rows } = await client.query<{ now: Date }>('SELECT now()');
  return rows[0].now;
}
