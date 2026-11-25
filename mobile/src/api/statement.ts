import { authGetResult, OfflineError } from './client';

export type StatementFilter = 'all' | 'in' | 'out';

/** One line of the statement; the other person's name comes masked from the server. */
export type StatementRow = { date: string; reference: string; direction: 'in' | 'out'; otherName: string; note: string | null; status: string; amountSen: number };

/** What GET /transactions/statement returns (task G12). No balance, on purpose. */
export type Statement = {
  ownerName: string;
  ownerPhone: string;
  from: string;
  to: string;
  filter: StatementFilter;
  totals: { inSen: number; outSen: number };
  rows: StatementRow[];
  truncated: boolean;
};

export type StatementResult = { ok: true; statement: Statement } | { ok: false; message: string };

/** Gets my transactions between two dates (YYYY-MM-DD, Malaysian time) for the PDF. The server checks the range. */
export async function getStatement(from: string, to: string, filter: StatementFilter): Promise<StatementResult> {
  try {
    const res = await authGetResult<Statement & { fields?: Record<string, string>; message?: string }>(`/transactions/statement?from=${from}&to=${to}&filter=${filter}`);
    if (res.ok) return { ok: true, statement: res.body };
    const field = res.body.fields ? Object.values(res.body.fields)[0] : undefined;
    return { ok: false, message: field ?? res.body.message ?? 'Something went wrong. Please try again.' };
  } catch (err) {
    if (err instanceof OfflineError) return { ok: false, message: "Can't reach MADD. Check your connection." };
    throw err;
  }
}
