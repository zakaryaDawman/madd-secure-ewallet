import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { FILTERS, getTransaction, listTransactions, TransactionFilter } from '../services/transactions';

export const transactionsRouter = Router();

const NOT_FOUND = { error: 'not_found', message: "We couldn't find this transaction." };

/** True if the text is one of the History filters (all, in, out, held). */
function isFilter(value: unknown): value is TransactionFilter {
  return typeof value === 'string' && (FILTERS as readonly string[]).includes(value);
}

/** GET /transactions?filter=all|in|out|held: the logged-in user's transactions, newest first. */
transactionsRouter.get('/', requireAuth, async (req, res, next) => {
  const filter = req.query.filter ?? 'all';
  if (!isFilter(filter)) {
    res.status(400).json({ error: 'validation', message: 'Filter must be all, in, out or held.' });
    return;
  }
  try {
    res.json({ transactions: await listTransactions(currentUser(res).userId, filter) });
  } catch (err) {
    next(err);
  }
});

/** GET /transactions/:id: one of the user's own transactions. Someone else's gives the same 404 as a missing one. */
transactionsRouter.get('/:id', requireAuth, async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const transaction = await getTransaction(currentUser(res).userId, id);
    if (!transaction) {
      res.status(404).json(NOT_FOUND);
      return;
    }
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});
