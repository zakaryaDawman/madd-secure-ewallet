import { ruleConfig } from './config';
import type { RuleResult } from './ruleResult';
import { formatRM } from '../utils/money';

/**
 * R1 Large amount (FR-11). Fires when the amount is above max(RM 500, 3 × the user's average past transfer).
 * With no past transfers the limit is RM 500. Compares whole numbers only (amount × count > 3 × sum), so no rounding.
 */
export function checkLargeAmount(amountSen: number, pastAmountsSen: number[]): RuleResult<LargeAmountDetails> {
  const sum = pastAmountsSen.reduce((total, amount) => total + amount, 0);
  const count = pastAmountsSen.length;
  const details = largeAmountDetails(amountSen, sum, count);
  const aboveFloor = amountSen > ruleConfig.largeAmountFloorSen;
  const aboveAverage = count === 0 || amountSen * count > ruleConfig.largeAmountMultiplier * sum;

  if (!aboveFloor || !aboveAverage) {
    return { fired: false, reason: `${formatRM(amountSen)} is within your usual range.`, details };
  }
  const floor = formatRM(ruleConfig.largeAmountFloorSen);
  if (count === 0) return { fired: true, reason: `${formatRM(amountSen)} is above your safe limit of ${floor}.`, details };
  return {
    fired: true,
    reason: `${formatRM(amountSen)} is more than ${ruleConfig.largeAmountMultiplier} times your usual transfer, and above your safe limit of ${floor}.`,
    details,
  };
}

/** The numbers R1 used, rounded to whole sen for display (the decision above uses exact whole-number maths). */
export type LargeAmountDetails = {
  amountSen: number;
  averageSen: number | null; // null for a new user with no past transfers
  floorSen: number;
  multiplier: number;
  limitSen: number; // max(floor, multiplier × average)
};

/** Works out R1's numbers for the security log. */
function largeAmountDetails(amountSen: number, sum: number, count: number): LargeAmountDetails {
  const averageSen = count === 0 ? null : Math.round(sum / count);
  const fromAverage = averageSen === null ? 0 : ruleConfig.largeAmountMultiplier * averageSen;
  return {
    amountSen,
    averageSen,
    floorSen: ruleConfig.largeAmountFloorSen,
    multiplier: ruleConfig.largeAmountMultiplier,
    limitSen: Math.max(ruleConfig.largeAmountFloorSen, fromAverage),
  };
}
