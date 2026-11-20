import { pool } from '../db/pool';
import { shortName } from '../utils/mask';
import { containsPattern } from '../utils/sqlLike';
import type { Rule } from './flaggedRows';
import { logCode, logLine, logTone, type LogTone } from './logText';
import type { SecurityEventType } from './securityLog';

export const LOG_PAGE_SIZE = 50;

/** One line of the Security log (design 22). No email, phone, device id, hash or token. */
export type LogEntry = { id: number; at: string; code: string; tone: LogTone; name: string; line: string };

/** One page of the log, and where the next (older) page starts, or null at the end. */
export type LogPage = { entries: LogEntry[]; nextBefore: number | null };

type Row = {
  id: number; created_at: Date; type: SecurityEventType; rule: Rule | null; reason: string;
  details: Record<string, number | string | null> | null; full_name: string; actor_name: string | null;
};

/** The rule's code name in SQL, so a search for "LARGE_AMOUNT" or "velocity" finds the rule (same names as RULE_CODES). */
const CODE_SQL = `CASE e.rule WHEN 'R1' THEN 'LARGE_AMOUNT' WHEN 'R2' THEN 'HIGH_VELOCITY'
  WHEN 'R3' THEN 'UNKNOWN_DEVICE' WHEN 'R4' THEN 'FAILED_LOGINS' ELSE '' END`;

/**
 * The security log, newest first, 50 at a time (FR-19). `search` matches the user's name, the rule (R1) or the
 * event code (e.g. "frozen", "LARGE_AMOUNT"); it is passed to SQL as a value, never pasted into the query.
 * `before` continues after the last row of the previous page.
 */
export async function readSecurityLog(search: string, before: number | null): Promise<LogPage> {
  const { rows } = await pool.query<Row>(
    `SELECT e.id, e.created_at, e.type, e.rule, e.reason, e.details, u.full_name, a.full_name AS actor_name
     FROM security_events e JOIN users u ON u.id = e.user_id LEFT JOIN users a ON a.id = e.actor_id
     WHERE ($1 = '' OR u.full_name ILIKE $1 OR a.full_name ILIKE $1 OR e.rule ILIKE $1 OR e.type ILIKE $1 OR ${CODE_SQL} ILIKE $1)
       AND ($2::int IS NULL OR e.id < $2)
     ORDER BY e.id DESC LIMIT $3`,
    [search ? containsPattern(search) : '', before, LOG_PAGE_SIZE + 1],
  );
  const page = rows.slice(0, LOG_PAGE_SIZE);
  return {
    entries: page.map(toEntry),
    nextBefore: rows.length > LOG_PAGE_SIZE ? page[page.length - 1].id : null,
  };
}


/**
 * One database row to one log line. An admin action shows who did it ("by MADD Admin") and, on the line,
 * which user and the admin's written reason (design 22).
 */
function toEntry(r: Row): LogEntry {
  const facts = { type: r.type, rule: r.rule, reason: r.reason, details: r.details };
  const base = { id: r.id, at: r.created_at.toISOString(), code: logCode(facts), tone: logTone(facts) };
  if (r.actor_name) return { ...base, name: `by ${r.actor_name}`, line: `${shortName(r.full_name)} · Reason: ${r.reason}` };
  return { ...base, name: shortName(r.full_name), line: logLine(facts) };
}
