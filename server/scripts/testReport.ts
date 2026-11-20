/**
 * F1: runs every server test and writes the results table for Chapter 6 (docs/F1/test-results.md and .csv).
 * Run with: npm run report:tests
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(__dirname, '..', '..', 'docs', 'F1');
const JSON_FILE = path.join(OUT_DIR, 'jest-results.json');

/** Which requirement each test file proves (FR-1 … FR-20, or Security / Setup). */
const AREA: Record<string, string> = {
  health: 'Setup',
  register: 'FR-1',
  login: 'FR-2, FR-9',
  wallet: 'FR-3',
  recipients: 'FR-4',
  transfers: 'FR-4, FR-5, FR-7',
  transactions: 'FR-6',
  me: 'FR-7',
  'pinLock.rule': 'FR-7',
  pinLock: 'FR-7',
  sessions: 'FR-8',
  devices: 'FR-9',
  'largeAmount.rule': 'FR-11',
  'velocity.rule': 'FR-12',
  'unknownDevice.rule': 'FR-13',
  newDevice: 'FR-13',
  'failedLogins.rule': 'FR-14',
  'loginLock.rule': 'FR-14',
  loginLock: 'FR-14',
  holds: 'FR-11, FR-12, FR-15, FR-16',
  holdDecision: 'FR-15',
  notifications: 'FR-15',
  push: 'FR-15',
  freeze: 'FR-15',
  roles: 'FR-17, FR-20',
  adminStats: 'FR-17, FR-18',
  adminFlagged: 'FR-18',
  adminLogs: 'FR-19',
  adminUsers: 'FR-17, FR-18, FR-20',
};

type JestAssertion = { ancestorTitles: string[]; title: string; status: string; duration: number | null; failureMessages: string[] };
type JestFile = { name: string; assertionResults: JestAssertion[] };
type Row = { id: string; area: string; file: string; test: string; expected: string; actual: string; result: 'Pass' | 'Fail'; ms: number };

/** Runs Jest once and saves its JSON results. Returns false if Jest could not run at all. */
function runJest(): boolean {
  const run = spawnSync('npx', ['jest', '--json', `--outputFile=${JSON_FILE}`], { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  return run.error === undefined;
}

/** Turns Jest's JSON into one row per test, numbered T001, T002… */
function toRows(files: JestFile[]): Row[] {
  const rows: Row[] = [];
  for (const file of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    const base = path.basename(file.name).replace('.test.ts', '');
    for (const t of file.assertionResults) {
      const passed = t.status === 'passed';
      rows.push({
        id: `T${String(rows.length + 1).padStart(3, '0')}`,
        area: AREA[base] ?? 'Other',
        file: base,
        test: [...t.ancestorTitles, t.title].join(' › '),
        expected: t.title.charAt(0).toUpperCase() + t.title.slice(1),
        actual: passed ? 'As expected' : firstLine(t.failureMessages[0] ?? 'Failed'),
        result: passed ? 'Pass' : 'Fail',
        ms: Math.round(t.duration ?? 0),
      });
    }
  }
  return rows;
}

/** The first meaningful line of a failure message. */
function firstLine(message: string): string {
  return message.replace(/\u001b\[\d+m/g, '').split('\n').find((l) => l.trim()) ?? 'Failed';
}

/** Makes text safe inside a Markdown table cell. */
function cell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

/** One summary line per requirement: how many tests, how many passed. */
function summaryByArea(rows: Row[]): string {
  const areas = new Map<string, { total: number; passed: number }>();
  for (const row of rows) {
    for (const area of row.area.split(', ')) {
      const a = areas.get(area) ?? { total: 0, passed: 0 };
      a.total += 1;
      if (row.result === 'Pass') a.passed += 1;
      areas.set(area, a);
    }
  }
  const order = (k: string) => (k.startsWith('FR-') ? Number(k.slice(3)) : 100);
  return [...areas.entries()]
    .sort(([a], [b]) => order(a) - order(b))
    .map(([area, a]) => `| ${area} | ${a.total} | ${a.passed} | ${a.passed === a.total ? 'Pass' : 'Fail'} |`)
    .join('\n');
}

/** Writes the Markdown report and the CSV (for Word/Excel). */
function writeReport(rows: Row[]): void {
  const passed = rows.filter((r) => r.result === 'Pass').length;
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' });
  const md = [
    '# MADD: server test results (Chapter 6)',
    '',
    `Run on ${when} (Malaysia time). Jest + Supertest against a separate PostgreSQL test database (\`madd_test\`).`,
    '',
    `**${passed} of ${rows.length} tests passed.**`,
    '',
    '## Summary by requirement',
    '',
    '| Requirement | Tests | Passed | Result |',
    '|---|---|---|---|',
    summaryByArea(rows),
    '',
    '## All tests',
    '',
    '| ID | Area | Test (file › group › case) | Expected | Actual | Result | ms |',
    '|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.id} | ${r.area} | ${cell(`${r.file} › ${r.test}`)} | ${cell(r.expected)} | ${cell(r.actual)} | ${r.result} | ${r.ms} |`),
    '',
  ].join('\n');
  writeFileSync(path.join(OUT_DIR, 'test-results.md'), md);
  const csvField = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const csv = [
    ['ID', 'Area', 'File', 'Test', 'Expected', 'Actual', 'Result', 'ms'].join(','),
    ...rows.map((r) => [r.id, r.area, r.file, r.test, r.expected, r.actual, r.result, r.ms].map(csvField).join(',')),
  ].join('\n');
  writeFileSync(path.join(OUT_DIR, 'test-results.csv'), csv);
  console.log(`\nWrote docs/F1/test-results.md and .csv: ${passed}/${rows.length} passed.`);
}

if (runJest()) {
  const files = (JSON.parse(readFileSync(JSON_FILE, 'utf8')) as { testResults: JestFile[] }).testResults;
  writeReport(toRows(files));
}
