import { ruleConfig } from './config';
import type { RuleResult } from './ruleResult';
import { formatRM } from '../utils/money';

/**
 * R1 Large amount (FR-11). Fires when the amount is above max(RM 500, 3 × the user's average past transfer).
 * With no past transfers the limit is RM 500. Compares whole numbers only (amount × count > 3 × sum), so no rounding.
 */
export function checkLargeAmount(amountSen: number, pastAmountsSen: number[]): RuleResult {
  const sum = pastAmountsSen.reduce((total, amount) => total + amount, 0);
  const count = pastAmountsSen.length;
  const aboveFloor = amountSen > ruleConfig.largeAmountFloorSen;
  const aboveAverage = count === 0 || amountSen * count > ruleConfig.largeAmountMultiplier * sum;

  if (aboveFloor && aboveAverage) {
    return { fired: true, reason: `${formatRM(amountSen)} is much larger than your usual transfers.` };
  }
  return { fired: false, reason: `${formatRM(amountSen)} is within your usual range.` };
}
