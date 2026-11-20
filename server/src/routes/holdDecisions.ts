import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { confirmHoldSchema } from '../validation/transfer';
import { confirmHold, DecisionError, rejectHold } from '../services/holdDecision';
import { fieldErrors } from './fieldErrors';
import { sendPinRefusal } from './pinRefusal';

export const holdDecisionsRouter = Router();

/** HTTP status and message for each reason a decision on a held transfer is refused. */
const REFUSALS: Record<DecisionError, { status: number; message: string }> = {
  not_found: { status: 404, message: "We couldn't find this transfer." },
  already_handled: { status: 409, message: 'This transfer was already handled.' },
  expired: { status: 410, message: "You didn't confirm within 5 minutes, so we cancelled it." },
  insufficient_funds: { status: 400, message: 'Not enough balance for this transfer.' },
};

/** Reads the transfer id from the path; anything that isn't a positive whole number counts as not found. */
function transferId(raw: unknown): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** POST /transfers/:id/confirm: "Yes, it was me" (design 29). Needs the PIN; sends the held money exactly once. */
holdDecisionsRouter.post('/:id/confirm', requireAuth, async (req, res, next) => {
  const parsed = confirmHoldSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  const id = transferId(req.params.id);
  if (!id) {
    res.status(404).json({ error: 'not_found', message: REFUSALS.not_found.message });
    return;
  }
  try {
    const result = await confirmHold(currentUser(res).userId, id, parsed.data.pin);
    if (result.ok) {
      res.status(201).json(result.receipt);
    } else if (result.error === 'wrong_pin' || result.error === 'pin_locked') {
      sendPinRefusal(res, result);
    } else {
      res.status(REFUSALS[result.error].status).json({ error: result.error, message: REFUSALS[result.error].message });
    }
  } catch (err) {
    next(err);
  }
});

/** POST /transfers/:id/reject: "No, freeze my account". Cancels the transfer, freezes the account, logs out every phone. */
holdDecisionsRouter.post('/:id/reject', requireAuth, async (req, res, next) => {
  const id = transferId(req.params.id);
  if (!id) {
    res.status(404).json({ error: 'not_found', message: REFUSALS.not_found.message });
    return;
  }
  try {
    const result = await rejectHold(currentUser(res).userId, id);
    if (result.ok) {
      res.json({ frozen: true, cancelledAmountSen: result.cancelledAmountSen });
    } else {
      res.status(REFUSALS[result.error].status).json({ error: result.error, message: REFUSALS[result.error].message });
    }
  } catch (err) {
    next(err);
  }
});
