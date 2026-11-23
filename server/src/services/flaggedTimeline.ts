import { pool } from '../db/pool';
import { ruleConfig } from '../rules/config';
import type { FlaggedRow } from './flaggedRows';
import type { FlaggedStatus } from './flaggedText';

const MINUTE_MS = 60_000;

/** One line of the detail timeline (design 48). `at` is null for a line with no time yet. */
export type TimelineStep = { label: string; at: string | null; state: 'done' | 'flag' | 'waiting' | 'bad' };

/** Extra facts for the timeline: the push alert sent about this event, and what the owner did with a held transfer. */
type TimelineFacts = {
  push: { sentAt: Date; ok: boolean; phones: number } | null;
  outcome: { type: 'HOLD_CONFIRMED' | 'HOLD_REJECTED' | 'HOLD_EXPIRED'; at: Date } | null;
  codeSentAt: Date | null; // when the one-time code was emailed to the owner (task G4)
};

/** Reads the push alert (from push_log, within a minute of the event) and the owner's decision (from the security log). */
export async function timelineFacts(row: FlaggedRow): Promise<TimelineFacts> {
  const kind = row.rule === 'R4' ? 'LOGIN_LOCKED' : row.transactionId === null ? 'NEW_DEVICE' : 'TRANSFER_HELD';
  const [push, outcome, code] = await Promise.all([
    pool.query<{ sent_at: Date; ok: boolean; phones: number }>(
      `SELECT sent_at, ok, phones FROM push_log WHERE user_id = $1 AND kind = $2
       AND event_at BETWEEN $3::timestamptz - interval '5 seconds' AND $3::timestamptz + interval '1 minute'
       ORDER BY event_at LIMIT 1`,
      [row.userId, kind, row.flaggedAt],
    ),
    row.transactionId === null
      ? Promise.resolve({ rows: [] })
      : pool.query<{ type: 'HOLD_CONFIRMED' | 'HOLD_REJECTED' | 'HOLD_EXPIRED'; created_at: Date }>(
          `SELECT type, created_at FROM security_events WHERE transaction_id = $1
           AND type IN ('HOLD_CONFIRMED', 'HOLD_REJECTED', 'HOLD_EXPIRED') ORDER BY created_at LIMIT 1`,
          [row.transactionId],
        ),
    row.transactionId === null
      ? Promise.resolve({ rows: [] })
      : pool.query<{ created_at: Date }>(`SELECT created_at FROM security_events WHERE transaction_id = $1 AND type = 'OTP_SENT' ORDER BY created_at LIMIT 1`, [
          row.transactionId,
        ]),
  ]);
  const p = push.rows[0];
  const o = outcome.rows[0];
  return {
    push: p ? { sentAt: p.sent_at, ok: p.ok, phones: p.phones } : null,
    outcome: o ? { type: o.type, at: o.created_at } : null,
    codeSentAt: code.rows[0]?.created_at ?? null,
  };
}

/**
 * The detail timeline (design 48), oldest first: what happened, the alert, and how it ended (or what it's waiting for).
 * Pure function: same facts, same timeline.
 */
export function buildTimeline(row: FlaggedRow, status: FlaggedStatus, facts: TimelineFacts): TimelineStep[] {
  const steps: TimelineStep[] = [];
  if (row.transferCreatedAt) steps.push({ label: 'Transfer submitted', at: row.transferCreatedAt.toISOString(), state: 'done' });
  steps.push({ label: flagLabel(row), at: row.flaggedAt.toISOString(), state: 'flag' });
  if (facts.push) {
    const to = `${facts.push.phones} trusted phone${facts.push.phones === 1 ? '' : 's'}`;
    steps.push({ label: facts.push.ok ? `Alert sent to ${to}` : `Alert to ${to} failed`, at: facts.push.sentAt.toISOString(), state: facts.push.ok ? 'done' : 'bad' });
  }
  if (facts.codeSentAt) steps.push({ label: 'Email code sent to the owner', at: facts.codeSentAt.toISOString(), state: 'done' });
  steps.push(endStep(row, status, facts));
  return steps;
}

/** "R1 flagged, transfer held" / "R3 flagged, new login" / "R4 flagged, sign-in locked". */
function flagLabel(row: FlaggedRow): string {
  if (row.rule === 'R4') return 'R4 flagged, sign-in locked';
  return row.transactionId === null ? `${row.rule} flagged, new login` : `${row.rule} flagged, transfer held`;
}

/** The last line: how it ended, or what it is still waiting for. */
function endStep(row: FlaggedRow, status: FlaggedStatus, facts: TimelineFacts): TimelineStep {
  const lockEnds = new Date(row.flaggedAt.getTime() + ruleConfig.lockMinutes * MINUTE_MS).toISOString();
  if (status === 'locked') return { label: `Sign-in unlocks at ${clock(lockEnds)}`, at: null, state: 'waiting' };
  if (status === 'lock_ended') return { label: 'Sign-in unlocked', at: lockEnds, state: 'done' };
  if (status === 'new_login') {
    return row.deviceTrusted ? { label: 'Device trusted by the owner', at: null, state: 'done' } : { label: 'Device not trusted yet', at: null, state: 'waiting' };
  }
  if (status === 'pending') return { label: `Waiting for user · expires ${clock(row.expiresAt!.toISOString())}`, at: null, state: 'waiting' };
  if (facts.outcome?.type === 'HOLD_CONFIRMED') return { label: 'Owner confirmed with PIN and email code, money sent', at: facts.outcome.at.toISOString(), state: 'done' };
  if (status === 'rejected') return { label: 'Cancelled, account frozen, no money moved', at: facts.outcome?.at.toISOString() ?? null, state: 'bad' };
  return { label: 'No answer in 5 minutes, cancelled, no money moved', at: (facts.outcome?.at ?? row.expiresAt)?.toISOString() ?? null, state: 'done' };
}

/** "21:47:07" in Malaysia time, for "expires …" / "unlocks at …" written inside a label. */
function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour12: false });
}
