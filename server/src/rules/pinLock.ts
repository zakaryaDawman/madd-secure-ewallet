import { ruleConfig } from './config';

/** One PIN check: was it right, and when. */
export type PinAttempt = { success: boolean; at: Date };

/** Either how many wrong tries are left, or when the lock ends. */
export type PinLockState = { locked: false; triesLeft: number } | { locked: true; unlocksAt: Date };

const MINUTE_MS = 60_000;

/**
 * Wrong PIN lock (pure function, no database). `attempts` are the user's latest PIN checks, oldest first.
 * Wrong PINs count in a row: a right PIN resets the count, and so do 15 quiet minutes after a wrong one.
 * The 5th wrong PIN in a row locks transfers for 15 minutes from that moment.
 */
export function pinLockState(attempts: PinAttempt[], now: Date): PinLockState {
  const lockMs = ruleConfig.lockMinutes * MINUTE_MS;
  let wrongInARow = 0;
  let lastWrong: Date | null = null;

  for (const attempt of attempts) {
    const quietTooLong = lastWrong !== null && attempt.at.getTime() - lastWrong.getTime() >= lockMs;
    if (attempt.success || quietTooLong) wrongInARow = 0;
    if (!attempt.success) {
      wrongInARow += 1;
      lastWrong = attempt.at;
    }
  }

  if (lastWrong === null || now.getTime() - lastWrong.getTime() >= lockMs) {
    return { locked: false, triesLeft: ruleConfig.pinMaxTries };
  }
  if (wrongInARow >= ruleConfig.pinMaxTries) {
    return { locked: true, unlocksAt: new Date(lastWrong.getTime() + lockMs) };
  }
  return { locked: false, triesLeft: ruleConfig.pinMaxTries - wrongInARow };
}
