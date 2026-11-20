import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { normalisePhone } from '../validation/register';
import { lookupRecipient, recentRecipients } from '../services/recipients';

const LOOKUPS_PER_MINUTE = 10;

/** Builds the /users routes. A new rate-limit counter is made each time, so every app (and every test) starts fresh. */
export function createUsersRouter() {
  const router = Router();

  /** Stops one user from trying many numbers to find out who uses MADD: max 10 lookups a minute. */
  const lookupLimiter = rateLimit({
    windowMs: 60_000,
    limit: LOOKUPS_PER_MINUTE,
    keyGenerator: (_req, res) => String(currentUser(res).userId),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'rate_limited', message: 'Too many searches. Please wait a minute and try again.' },
  });

  /** GET /users/lookup?phone=...: finds a MADD user to pay, showing only a masked name and phone. */
  router.get('/lookup', requireAuth, lookupLimiter, async (req, res, next) => {
    const phone = normalisePhone(String(req.query.phone ?? ''));
    if (!phone) {
      res.status(400).json({ error: 'invalid_phone', message: 'Enter a Malaysian mobile number, e.g. 012 345 6789' });
      return;
    }
    try {
      const result = await lookupRecipient(currentUser(res).userId, phone);
      if ('found' in result) {
        res.json(result.found);
      } else if (result.error === 'self') {
        res.status(400).json({ error: 'self', message: "This is your own number. You can't send money to yourself." });
      } else {
        res.status(404).json({ error: 'not_found', message: "We couldn't find a MADD user with this number. Check it and try again." });
      }
    } catch (err) {
      next(err);
    }
  });

  /** GET /users/recent: the last people this user sent money to. */
  router.get('/recent', requireAuth, async (_req, res, next) => {
    try {
      res.json(await recentRecipients(currentUser(res).userId));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
