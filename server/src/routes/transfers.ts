import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { normalisePhone } from '../validation/register';
import { transferSchema } from '../validation/transfer';
import { sendMoney, TransferError } from '../services/transfers';
import { fieldErrors } from './fieldErrors';
import { sendPinRefusal } from './pinRefusal';

export const transfersRouter = Router();

/** HTTP status and message for each reason a transfer can be refused. */
const REFUSALS: Record<TransferError, { status: number; message: string }> = {
  recipient_not_found: { status: 404, message: "We couldn't find a MADD user with this number." },
  self: { status: 400, message: "You can't send money to yourself." },
  insufficient_funds: { status: 400, message: 'Not enough balance for this transfer.' },
};

/** POST /transfers: sends money after checking the PIN, or holds it (202) if rule R1 or R2 fires. */
transfersRouter.post('/', requireAuth, async (req, res, next) => {
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  const phone = normalisePhone(parsed.data.recipientPhone);
  if (!phone) {
    res.status(400).json({ error: 'validation', fields: { recipientPhone: 'Enter a Malaysian mobile number' } });
    return;
  }

  try {
    const result = await sendMoney(currentUser(res), parsed.data, phone);
    if (result.ok && result.status === 'held') {
      res.status(202).json({ held: true, id: result.id }); // a rule fired: no money moved, the owner must confirm
      return;
    }
    if (result.ok) {
      res.status(201).json(result.receipt);
      return;
    }
    if (result.error === 'wrong_pin' || result.error === 'pin_locked') {
      sendPinRefusal(res, result);
      return;
    }
    const refusal = REFUSALS[result.error];
    res.status(refusal.status).json({ error: result.error, message: refusal.message });
  } catch (err) {
    next(err);
  }
});
