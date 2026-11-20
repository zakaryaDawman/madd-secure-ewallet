import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { changePinSchema, updateProfileSchema } from '../validation/profile';
import { changePin, getProfile, updateName } from '../services/me';
import { fieldErrors } from './fieldErrors';

export const meRouter = Router();

/** GET /me: my details and my devices, with the phone making this request marked "this phone". */
meRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const { userId, deviceId } = currentUser(res);
    const profile = await getProfile(userId, deviceId);
    if (!profile) {
      res.status(404).json({ error: 'not_found', message: 'Account not found.' });
      return;
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/** PATCH /me: changes my full name. Any other field (email, phone) is refused. */
meRouter.patch('/', requireAuth, async (req, res, next) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  try {
    await updateName(currentUser(res).userId, parsed.data.fullName);
    res.json({ fullName: parsed.data.fullName });
  } catch (err) {
    next(err);
  }
});

/** POST /me/pin: changes my PIN after checking the current one. */
meRouter.post('/pin', requireAuth, async (req, res, next) => {
  const parsed = changePinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  try {
    if (!(await changePin(currentUser(res).userId, parsed.data))) {
      res.status(403).json({ error: 'wrong_pin', message: 'Your current PIN is wrong.' });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
