import type { Response } from 'express';
import type { PinCheck } from '../services/pinCheck';
import { ruleConfig } from '../rules/config';

/**
 * Answers a refused PIN: 403 with the tries left (design 31, state 1),
 * or 423 "Locked" with the unlock time once there were 5 wrong PINs in a row (state 2).
 */
export function sendPinRefusal(res: Response, check: Exclude<PinCheck, { ok: true }>): void {
  if (check.error === 'pin_locked') {
    res.status(423).json({
      error: 'pin_locked',
      message: `Too many wrong PINs. Transfers are locked for ${ruleConfig.lockMinutes} minutes.`,
      unlocksAt: check.unlocksAt.toISOString(),
    });
    return;
  }
  const tries = check.triesLeft === 1 ? '1 try' : `${check.triesLeft} tries`;
  res.status(403).json({
    error: 'wrong_pin',
    message: `Wrong PIN. ${tries} left before transfers are locked.`,
    triesLeft: check.triesLeft,
  });
}
