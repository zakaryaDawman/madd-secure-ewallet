import type { Response } from 'express';
import type { CodeCheck } from '../services/emailOtp';

/**
 * Answers a refused email code (task G4): 403 with the tries left, 423 once 5 wrong codes locked it
 * (the transfer can then only be cancelled), or 410 when the code ran out or was already used.
 */
export function sendCodeRefusal(res: Response, check: Exclude<CodeCheck, { ok: true } | { error: 'not_found' }>): void {
  if (check.error === 'wrong_code') {
    const tries = check.triesLeft === 1 ? '1 try' : `${check.triesLeft} tries`;
    res.status(403).json({ error: 'wrong_code', message: `Wrong code. ${tries} left.`, triesLeft: check.triesLeft });
  } else if (check.error === 'code_locked') {
    res.status(423).json({ error: 'code_locked', message: 'Too many wrong codes. This transfer can only be cancelled now.' });
  } else {
    res.status(410).json({ error: 'code_expired', message: 'This code has run out. Ask for a new one.' });
  }
}
