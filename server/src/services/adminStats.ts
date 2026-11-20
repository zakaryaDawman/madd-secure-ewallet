import { pool } from '../db/pool';
import { shortName } from '../utils/mask';
import { adminEventText, EventTone } from './adminEventText';
import { lockedEmails } from './loginLock';
import type { SecurityEventType } from './securityLog';

const TIME_ZONE = 'Asia/Kuala_Lumpur'; // "today" means today in Malaysia
const RULES = ['R1', 'R2', 'R3', 'R4'] as const;
const LATEST_EVENTS = 5;

export type AdminStats = {
  alertsToday: number;
  heldNow: number;
  frozenAccounts: number;
  lockedSignIns: number;
  byRule: { rule: (typeof RULES)[number]; count: number }[]; // last 7 days
  byRuleTotal: number;
  latest: { id: number; name: string; text: string; tone: EventTone; at: string }[];
};

/** Everything the admin dashboard (design 20) shows, read from the database. Never includes hashes, PINs or tokens. */
export async function adminStats(): Promise<AdminStats> {
  const [counters, byRule, latest, locked] = await Promise.all([counts(), alertsByRule(), latestEvents(), lockedEmails()]);
  return { ...counters, lockedSignIns: locked.size, byRule, byRuleTotal: byRule.reduce((sum, r) => sum + r.count, 0), latest };
}

/** Alerts today (rules that fired since midnight in Malaysia), transfers held right now, frozen accounts. */
async function counts(): Promise<{ alertsToday: number; heldNow: number; frozenAccounts: number }> {
  const { rows } = await pool.query<{ alerts_today: number; held_now: number; frozen: number }>(
    `SELECT
       (SELECT count(*) FROM security_events WHERE type = 'RULE_FIRED'
          AND created_at >= date_trunc('day', now() AT TIME ZONE $1) AT TIME ZONE $1)::int AS alerts_today,
       (SELECT count(*) FROM transactions WHERE status = 'PENDING' AND expires_at > now())::int AS held_now,
       (SELECT count(*) FROM users WHERE frozen_at IS NOT NULL)::int AS frozen`,
    [TIME_ZONE],
  );
  return { alertsToday: rows[0].alerts_today, heldNow: rows[0].held_now, frozenAccounts: rows[0].frozen };
}

/** How many times each rule fired in the last 7 days (R1–R4, zero if never). */
async function alertsByRule(): Promise<AdminStats['byRule']> {
  const { rows } = await pool.query<{ rule: string; count: number }>(
    `SELECT rule, count(*)::int AS count FROM security_events
     WHERE type = 'RULE_FIRED' AND created_at > now() - interval '7 days' GROUP BY rule`,
  );
  return RULES.map((rule) => ({ rule, count: rows.find((r) => r.rule === rule)?.count ?? 0 }));
}

/** The newest security events, worded for the dashboard, with a short name (no email, phone or secrets). */
async function latestEvents(): Promise<AdminStats['latest']> {
  const { rows } = await pool.query<{ id: number; full_name: string; type: SecurityEventType; rule: string | null; amount_sen: string | null; created_at: Date }>(
    `SELECT e.id, u.full_name, e.type, e.rule, t.amount_sen, e.created_at
     FROM security_events e JOIN users u ON u.id = e.user_id LEFT JOIN transactions t ON t.id = e.transaction_id
     ORDER BY e.created_at DESC, e.id DESC LIMIT $1`,
    [LATEST_EVENTS],
  );
  return rows.map((r) => ({
    id: r.id,
    name: shortName(r.full_name),
    ...adminEventText({ type: r.type, rule: r.rule, amountSen: r.amount_sen === null ? null : Number(r.amount_sen) }),
    at: r.created_at.toISOString(),
  }));
}

