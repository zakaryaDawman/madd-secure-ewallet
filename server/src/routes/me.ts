import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { changePinSchema, updateProfileSchema } from '../validation/profile';
import { changePin, getProfile, updateName } from '../services/me';
import { fieldErrors } from './fieldErrors';
import { freezeByOwner } from '../services/freeze';
import { sendPinRefusal } from './pinRefusal';

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

/** POST /me/pin: changes my PIN after checking the current one (wrong tries count towards the PIN lock). */
meRouter.post('/pin', requireAuth, async (req, res, next) => {
  const parsed = changePinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  try {
    const check = await changePin(currentUser(res).userId, parsed.data);
    if (!check.ok) {
      sendPinRefusal(res, check);
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/** POST /me/freeze: "Freeze my account" from a lock item in the Inbox, on a trusted phone. Logs out every phone. */
meRouter.post('/freeze', requireAuth, async (_req, res, next) => {
  try {
    const frozen = await freezeByOwner(currentUser(res), 'Account frozen by the owner from the Inbox. Every session was ended.');
    if (frozen) res.json({ frozen: true });
    else res.status(403).json({ error: 'needs_trusted_device', message: 'Do this on your usual phone.' });
  } catch (err) {
    next(err);
  }
});
