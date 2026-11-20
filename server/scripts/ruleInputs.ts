/** Realistic inputs for timing each detection rule (F1 measurements). */
import { checkLargeAmount } from '../src/rules/largeAmount';
import { checkVelocity } from '../src/rules/velocity';
import { checkUnknownDevice } from '../src/rules/unknownDevice';
import { checkFailedLogins } from '../src/rules/failedLogins';
import { loginLockState } from '../src/rules/loginLock';
import { pinLockState } from '../src/rules/pinLock';

const NOW = new Date();
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);
const PAST_AMOUNTS = Array.from({ length: 200 }, (_, i) => 5_000 + (i % 20) * 500); // 200 past transfers
const RECENT = [minutesAgo(1), minutesAgo(2), minutesAgo(3)];
const TRUSTED = ['a', 'b', 'c'];
const ATTEMPTS = Array.from({ length: 10 }, (_, i) => ({ success: i % 3 === 0, at: minutesAgo(i) }));

/** Each rule with a name for the report and one call to time. */
export const ALL_RULES = [
  { name: 'R1 Large amount (200 past transfers)', run: () => checkLargeAmount(80_000, PAST_AMOUNTS) },
  { name: 'R2 Velocity', run: () => checkVelocity(RECENT, NOW) },
  { name: 'R3 Unknown device', run: () => checkUnknownDevice('d', TRUSTED) },
  { name: 'R4 Failed logins (10 attempts)', run: () => checkFailedLogins(ATTEMPTS, NOW) },
  { name: 'Sign-in lock (R4 over time)', run: () => loginLockState(ATTEMPTS, NOW) },
  { name: 'PIN lock', run: () => pinLockState(ATTEMPTS, NOW) },
];
