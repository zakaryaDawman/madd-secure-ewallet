import { ruleConfig } from './config';
import type { RuleResult } from './ruleResult';

const MINUTE_MS = 60_000;

/**
 * R2 Velocity (FR-12). Fires when this transfer would be more than 3 within 5 minutes.
 * `recentTransfers` are the times of the user's earlier transfers; the one being checked counts too.
 */
export function checkVelocity(recentTransfers: Date[], now: Date): RuleResult<VelocityDetails> {
  const windowStart = now.getTime() - ruleConfig.velocityWindowMinutes * MINUTE_MS;
  const times = recentTransfers.filter((at) => at.getTime() > windowStart).map((at) => at.getTime());
  const inWindow = times.length + 1; // + this transfer
  const details = {
    count: inWindow,
    maxTransfers: ruleConfig.velocityMaxTransfers,
    windowMinutes: ruleConfig.velocityWindowMinutes,
    spanSeconds: times.length === 0 ? 0 : Math.round((now.getTime() - Math.min(...times)) / 1000),
  };

  if (inWindow > ruleConfig.velocityMaxTransfers) {
    return { fired: true, reason: `${inWindow} transfers in ${ruleConfig.velocityWindowMinutes} minutes is faster than usual.`, details };
  }
  return { fired: false, reason: `${inWindow} of ${ruleConfig.velocityMaxTransfers} transfers allowed in ${ruleConfig.velocityWindowMinutes} minutes.`, details };
}

/** The numbers R2 used: transfers counted (this one included), the limit, the window, and how long they actually took. */
export type VelocityDetails = { count: number; maxTransfers: number; windowMinutes: number; spanSeconds: number };
