import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { pinOnlySchema } from '../validation/transfer';
import { isTrustedDevice, pendingDevice } from '../services/devices';
import { rejectDevice, trustDevice } from '../services/deviceDecision';
import { fieldErrors } from './fieldErrors';
import { sendPinRefusal } from './pinRefusal';

export const devicesRouter = Router();

const NEEDS_TRUSTED = { error: 'needs_trusted_device', message: 'Do this on your usual phone.' };

/** GET /me/devices/pending: a new phone waiting for the owner's decision (design 13). Only a trusted phone is told. */
devicesRouter.get('/pending', requireAuth, async (_req, res, next) => {
  try {
    const { userId, deviceId } = currentUser(res);
    const device = (await isTrustedDevice(userId, deviceId)) ? await pendingDevice(userId) : null;
    res.json({ device });
  } catch (err) {
    next(err);
  }
});

/** POST /me/devices/:deviceId/trust: "Trust this device" with the PIN (design 45), from a trusted phone. */
devicesRouter.post('/:deviceId/trust', requireAuth, async (req, res, next) => {
  const parsed = pinOnlySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  try {
    const result = await trustDevice(currentUser(res), String(req.params.deviceId), parsed.data.pin);
    if (result.ok) res.status(204).end();
    else if (result.error === 'wrong_pin' || result.error === 'pin_locked') sendPinRefusal(res, result);
    else if (result.error === 'needs_trusted_device') res.status(403).json(NEEDS_TRUSTED);
    else res.status(404).json({ error: 'not_found', message: "We couldn't find this device." });
  } catch (err) {
    next(err);
  }
});

/** POST /me/devices/:deviceId/reject: "No, freeze my account" on the new device alert. Freezes and logs out every phone. */
devicesRouter.post('/:deviceId/reject', requireAuth, async (req, res, next) => {
  try {
    const { userId } = currentUser(res);
    const device = await pendingDevice(userId);
    if (!device || device.deviceId !== req.params.deviceId) {
      res.status(404).json({ error: 'not_found', message: "We couldn't find this device." });
      return;
    }
    const result = await rejectDevice(currentUser(res), device.name);
    if (result.ok) res.json({ frozen: true });
    else res.status(403).json(NEEDS_TRUSTED);
  } catch (err) {
    next(err);
  }
});
