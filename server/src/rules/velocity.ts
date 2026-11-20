import { ruleConfig } from './config';
import type { RuleResult } from './ruleResult';

const MINUTE_MS = 60_000;

/**
 * R2 Velocity (FR-12). Fires when this transfer would be more than 3 within 5 minutes.
 * `recentTransfers` are the times of the user's earlier transfers; the one being checked counts too.
 */
export function checkVelocity(recentTransfers: Date[], now: Date): RuleResult {
  const windowStart = now.getTime() - ruleConfig.velocityWindowMinutes * MINUTE_MS;
  const inWindow = recentTransfers.filter((at) => at.getTime() > windowStart).length + 1; // + this transfer

  if (inWindow > ruleConfig.velocityMaxTransfers) {
    return { fired: true, reason: `${inWindow} transfers in ${ruleConfig.velocityWindowMinutes} minutes is faster than usual.` };
  }
  return { fired: false, reason: `${inWindow} of ${ruleConfig.velocityMaxTransfers} transfers allowed in ${ruleConfig.velocityWindowMinutes} minutes.` };
}
