/**
 * F1: measures performance against the NFRs and writes docs/F1/measurements.md.
 * Uses the separate TEST database only (it is emptied first). Run with: npm run report:measure
 */
import { writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

process.env.NODE_ENV = 'test'; // quiet request logging
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://madd:madd_dev_only@localhost:5433/madd_test';
process.env.JWT_SECRET ??= 'measure-secret';

const OUT = path.join(__dirname, '..', '..', 'docs', 'F1', 'measurements.md');
const RULE_RUNS = 10_000;
const REQUEST_RUNS = 50;
const DEVICE = '11111111-1111-4111-8111-111111111111';

/** Suggested NFR targets (replace with the SRS values if they differ). */
const TARGETS = { ruleMs: 50, transferMs: 1000, loginMs: 1000, alertMs: 5000 };

type Stats = { runs: number; meanMs: number; medianMs: number; p95Ms: number; maxMs: number };

/** Mean, median, 95th percentile and max of a list of times in ms. */
function stats(times: number[]): Stats {
  const sorted = [...times].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return { runs: times.length, meanMs: times.reduce((s, t) => s + t, 0) / times.length, medianMs: at(0.5), p95Ms: at(0.95), maxMs: sorted[sorted.length - 1] };
}

/** Times one function call RULE_RUNS times. */
function timeEach(run: () => unknown): Stats {
  const times: number[] = [];
  for (let i = 0; i < RULE_RUNS; i++) {
    const start = performance.now();
    run();
    times.push(performance.now() - start);
  }
  return stats(times);
}

/** "0.004 ms" / "312 ms": readable time. */
function ms(value: number): string {
  return value < 1 ? `${value.toFixed(4)} ms` : `${Math.round(value)} ms`;
}

/** One table row: what was measured, its numbers, the target and pass/fail (judged on the 95th percentile). */
function row(name: string, s: Stats, targetMs: number): string {
  return `| ${name} | ${s.runs} | ${ms(s.meanMs)} | ${ms(s.medianMs)} | ${ms(s.p95Ms)} | ${ms(s.maxMs)} | < ${targetMs} ms | ${s.p95Ms < targetMs ? 'Pass' : 'Fail'} |`;
}

/** Runs every measurement and writes the report. */
async function main() {
  const [{ createApp }, { pool }, { migrate }, rules, { setPushSender, pushesSettled }, request, bcrypt] = await Promise.all([
    import('../src/app'),
    import('../src/db/pool'),
    import('../src/db/migrate'),
    import('./ruleInputs'),
    import('../src/services/push'),
    import('supertest').then((m) => m.default),
    import('bcrypt'),
  ]);
  await migrate(pool);
  await pool.query(`ALTER TABLE security_events DISABLE TRIGGER USER;
    TRUNCATE security_events, notifications, push_log, pin_attempts, login_attempts, known_devices, sessions, transactions, wallets, users RESTART IDENTITY CASCADE;
    ALTER TABLE security_events ENABLE TRIGGER USER;`);
  const app = createApp();

  // 1. Each detection rule on its own (pure functions, no database).
  const ruleRows = rules.ALL_RULES.map((r) => row(r.name, timeEach(r.run), TARGETS.ruleMs));

  // Two customers; the sender's phone gets a push token so held transfers send an alert (to a fake Firebase).
  for (const [name, email, phone] of [['Zakarya Dawman', 'zak@email.com', '0123456789'], ['Ahmad Ali', 'ahmad@email.com', '0123454521']]) {
    await request(app).post('/auth/register').send({ fullName: name, email, phone, password: 'password12', pin: '482913' });
  }
  const token = (await request(app).post('/auth/login').send({ email: 'zak@email.com', password: 'password12', deviceId: DEVICE, deviceName: 'Test' })).body.token as string;
  await request(app).post('/me/push-token').set('Authorization', `Bearer ${token}`).send({ token: 'fake-phone' });
  let pushedAt = 0;
  setPushSender(async () => {
    pushedAt = performance.now();
    return true;
  });

  /** Sends one transfer and returns how long the server took to decide (ms). Older transfers are moved back in time so R2 doesn't fire. */
  async function timedTransfer(amountSen: number): Promise<number> {
    await pool.query("UPDATE transactions SET created_at = created_at - interval '10 minutes'");
    const start = performance.now();
    await request(app).post('/transfers').set('Authorization', `Bearer ${token}`).send({ recipientPhone: '012 345 4521', amountSen, note: '', pin: '482913' });
    return performance.now() - start;
  }

  // 2. Whole transfer decisions over HTTP: PIN check + rules + one database transaction.
  const normal: number[] = [];
  for (let i = 0; i < REQUEST_RUNS; i++) normal.push(await timedTransfer(100));
  const held: number[] = [];
  const alerts: number[] = [];
  for (let i = 0; i < REQUEST_RUNS; i++) {
    const start = performance.now();
    held.push(await timedTransfer(80_000)); // RM 800: above the RM 500 limit and 3 x the RM 1 usual, so R1 holds it
    await pushesSettled();
    alerts.push(pushedAt - start);
  }

  // 3. Logins (password check + R3 + R4 + session).
  const logins: number[] = [];
  for (let i = 0; i < REQUEST_RUNS; i++) {
    const start = performance.now();
    await request(app).post('/auth/login').send({ email: 'zak@email.com', password: 'password12', deviceId: DEVICE, deviceName: 'Test' });
    logins.push(performance.now() - start);
  }

  // For context: one bcrypt check (cost 12) is most of the transfer and login time, on purpose (slow hashes resist guessing).
  const hash = await bcrypt.hash('482913', 12);
  const bcryptTimes: number[] = [];
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    await bcrypt.compare('482913', hash);
    bcryptTimes.push(performance.now() - start);
  }
  const { rows } = await pool.query<{ ms: string }>('SELECT EXTRACT(EPOCH FROM sent_at - event_at) * 1000 AS ms FROM push_log');

  writeReport({
    ruleRows,
    normal: row('Normal transfer (sent)', stats(normal), TARGETS.transferMs),
    held: row('Unusual transfer (held by R1)', stats(held), TARGETS.transferMs),
    login: row('Login', stats(logins), TARGETS.loginMs),
    alert: row('Held transfer → push handed to Firebase', stats(alerts), TARGETS.alertMs),
    pushLog: row('push_log: event saved → push sent', stats(rows.map((r) => Number(r.ms))), TARGETS.alertMs),
    bcrypt: stats(bcryptTimes),
  });
  await pool.end();
}

/** Writes docs/F1/measurements.md. */
function writeReport(r: { ruleRows: string[]; normal: string; held: string; login: string; alert: string; pushLog: string; bcrypt: Stats }) {
  const header = '| Measured | Runs | Mean | Median | 95th % | Max | Target | Result |\n|---|---|---|---|---|---|---|---|';
  const md = [
    '# MADD: performance measurements (Chapter 6)',
    '',
    `Measured on ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' })} (Malaysia time) on ${os.cpus()[0].model}, ${Math.round(os.totalmem() / 1e9)} GB RAM, Node ${process.version}, PostgreSQL 16 in Docker, all on one laptop.`,
    '',
    '**Targets are suggested values (rule < 50 ms, decision < 1 s, alert < 5 s); replace them with the SRS NFR values if different.** Pass/Fail is judged on the 95th percentile.',
    '',
    '## 1. Rule evaluation (pure functions, no database)',
    '',
    header,
    ...r.ruleRows,
    '',
    '## 2. Server decisions over HTTP (PIN or password check, rules, database)',
    '',
    header,
    r.normal,
    r.held,
    r.login,
    '',
    `Most of this time is the bcrypt check (cost 12): one check takes about ${ms(r.bcrypt.medianMs)} here. That slowness is deliberate, so stolen hashes are hard to guess.`,
    '',
    '## 3. Alert time (event → push sent)',
    '',
    header,
    r.alert,
    r.pushLog,
    '',
    'Measured with a stand-in for Firebase, so this is the time MADD takes to decide and hand the alert over. Delivery to a real phone',
    'over the internet is added after the Firebase setup and app build (D7, still to do), and should be measured then:',
    '',
    '| Held transfer → alert shown on a real phone | (after the build) | | | | | < 5000 ms | To measure |',
    '',
  ].join('\n');
  writeFileSync(OUT, md);
  console.log('Wrote docs/F1/measurements.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
