import type { Statement, StatementRow } from '../api/statement';
import { colors } from '../theme';
import { formatRM } from './money';
import { longDate } from './statementRange';

const FILTER_NAMES = { all: 'All transactions', in: 'Money in', out: 'Money out' } as const;
const STATUS_NAMES: Record<string, string> = { COMPLETED: 'Completed', PENDING: 'Held', CANCELLED: 'Cancelled', EXPIRED: 'Expired' };

/** Makes text safe to put inside HTML (names and notes are typed by people). */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

/** Date and time in Malaysia, e.g. "25 Nov 2026, 9:15 pm". */
function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' });
}

/** One table row: money in green with +, money out red with − (like History, task G7). Only completed ones count. */
function rowHtml(row: StatementRow): string {
  const sign = row.direction === 'in' ? '+' : '−';
  const colour = row.status !== 'COMPLETED' ? colors.muted : row.direction === 'in' ? colors.moneyIn : colors.dangerText;
  const who = `${row.direction === 'in' ? 'From' : 'To'} ${escapeHtml(row.otherName)}`;
  const note = row.note ? `<div class="sub">${escapeHtml(row.note)}</div>` : '';
  return `<tr><td>${dateTime(row.date)}<div class="sub">${row.reference}</div></td><td>${who}${note}</td><td>${STATUS_NAMES[row.status] ?? row.status}</td><td class="amt" style="color:${colour}">${sign} ${formatRM(row.amountSen)}</td></tr>`;
}

/** The whole MADD-branded statement page (task G12): owner (phone masked), period, totals and every transfer. No balance. */
export function statementHtml(s: Statement): string {
  const rows = s.rows.length > 0 ? s.rows.map(rowHtml).join('') : '<tr><td colspan="4" class="empty">No transactions in this period.</td></tr>';
  const cut = s.truncated ? '<p class="note">Only the first 2,000 transactions are shown. Choose a shorter period to see the rest.</p>' : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { font-family: sans-serif; color: ${colors.ink}; margin: 32px; font-size: 12px; }
    .top { display: flex; justify-content: space-between; border-bottom: 3px solid ${colors.blue}; padding-bottom: 12px; }
    .brand { font-size: 28px; font-weight: 800; color: ${colors.blue}; letter-spacing: -1px; }
    .meta { text-align: right; color: ${colors.muted}; }
    h1 { font-size: 18px; margin: 20px 0 4px; }
    .totals { display: flex; gap: 12px; margin: 16px 0; }
    .box { flex: 1; background: ${colors.background}; border-radius: 10px; padding: 10px 14px; }
    .box b { display: block; font-size: 16px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; background: ${colors.tint}; padding: 8px; font-size: 11px; }
    td { padding: 8px; border-bottom: 1px solid ${colors.line}; vertical-align: top; }
    .sub { color: ${colors.muted}; font-size: 10px; margin-top: 2px; }
    .amt { text-align: right; white-space: nowrap; font-weight: 700; }
    .empty { text-align: center; color: ${colors.muted}; padding: 24px; }
    .note { color: ${colors.muted}; font-size: 10px; margin-top: 16px; }
  </style></head><body>
    <div class="top"><div class="brand">MADD</div><div class="meta">${escapeHtml(s.ownerName)}<br>${s.ownerPhone}</div></div>
    <h1>Statement · ${FILTER_NAMES[s.filter]}</h1>
    <div class="sub">${longDate(s.from)} – ${longDate(s.to)} (Malaysia time)</div>
    <div class="totals">
      <div class="box">Money in<b style="color:${colors.moneyIn}">+ ${formatRM(s.totals.inSen)}</b></div>
      <div class="box">Money out<b style="color:${colors.dangerText}">− ${formatRM(s.totals.outSen)}</b></div>
    </div>
    <table><tr><th>Date</th><th>Details</th><th>Status</th><th style="text-align:right">Amount</th></tr>${rows}</table>
    ${cut}
    <p class="note">Totals count completed transfers only. Names and numbers are partly hidden. Made by the MADD app on ${dateTime(new Date().toISOString())}.</p>
  </body></html>`;
}
