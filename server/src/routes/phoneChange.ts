import { Router, type Response } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { confirmPhoneChangeSchema, startPhoneChangeSchema } from '../validation/phoneChange';
import { confirmPhoneChange, resendPhoneCode, startPhoneChange } from '../services/phoneChange';
import type { ResendResult } from '../services/emailOtp';
import { fieldErrors } from './fieldErrors';
import { sendPinRefusal } from './pinRefusal';

/** /me/phone routes (task G11): change my phone number with my PIN and a code emailed to me. */
export const phoneChangeRouter = Router();

const NO_CHANGE = { status: 404, body: { error: 'not_found', message: 'Start the phone change again.' } };

/** POST /me/phone { phone, pin }: checks the PIN and the number, then emails me a code. */
phoneChangeRouter.post('/', requireAuth, async (req, res, next) => {
  const parsed = startPhoneChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  try {
    const result = await startPhoneChange(currentUser(res).userId, parsed.data.pin, parsed.data.phone);
    if (result.ok) res.json({ sentTo: result.sentTo });
    else if (result.error === 'same_phone') res.status(400).json({ error: 'same_phone', fields: { phone: 'This is already your number.' } });
    else if (result.error === 'phone_taken') res.status(409).json({ error: 'phone_taken', fields: { phone: "This number can't be used. Try another." } });
    else if (result.error === 'resend_cooldown') sendResendRefusal(res, result);
    else sendPinRefusal(res, result);
  } catch (err) {
    next(err);
  }
});

/** POST /me/phone/confirm { code }: the right code saves the new number. */
phoneChangeRouter.post('/confirm', requireAuth, async (req, res, next) => {
  const parsed = confirmPhoneChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  try {
    const result = await confirmPhoneChange(currentUser(res).userId, parsed.data.code);
    if (result.ok) res.status(204).end();
    else if (result.error === 'wrong_code') {
      const tries = result.triesLeft === 1 ? '1 try' : `${result.triesLeft} tries`;
      res.status(403).json({ error: 'wrong_code', message: `Wrong code. ${tries} left.`, triesLeft: result.triesLeft });
    } else if (result.error === 'code_locked') res.status(423).json({ error: 'code_locked', message: 'Too many wrong codes. Start the phone change again.' });
    else if (result.error === 'code_expired') res.status(410).json({ error: 'code_expired', message: 'This code has run out. Ask for a new one.' });
    else if (result.error === 'phone_taken') res.status(409).json({ error: 'phone_taken', message: "This number can't be used any more. Try another." });
    else res.status(NO_CHANGE.status).json(NO_CHANGE.body);
  } catch (err) {
    next(err);
  }
});

/** POST /me/phone/resend: a new code for the same new number (60 s apart, at most 3 emails). */
phoneChangeRouter.post('/resend', requireAuth, async (_req, res, next) => {
  try {
    const result = await resendPhoneCode(currentUser(res).userId);
    if (result.ok) res.json({ message: 'We sent a new code.' });
    else if (result.error === 'not_found') res.status(NO_CHANGE.status).json(NO_CHANGE.body);
    else sendResendRefusal(res, result);
  } catch (err) {
    next(err);
  }
});

/** 429 for "wait before asking again" or "no more emails for this change". */
function sendResendRefusal(res: Response, result: Exclude<ResendResult, { ok: true } | { error: 'not_found' }>): void {
  if (result.error === 'resend_cooldown') {
    res.status(429).json({ error: 'resend_cooldown', message: `Wait ${result.secondsLeft} seconds before asking for another code.`, secondsLeft: result.secondsLeft });
  } else {
    res.status(429).json({ error: 'resend_limit', message: 'No more codes for this change. Start again later.' });
  }
}
