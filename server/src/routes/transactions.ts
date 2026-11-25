import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { FILTERS, getTransaction, listTransactions, TransactionFilter } from '../services/transactions';
import { getStatement } from '../services/statement';
import { statementSchema } from '../validation/statement';
import { fieldErrors } from './fieldErrors';

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

/** GET /transactions/statement?from=YYYY-MM-DD&to=YYYY-MM-DD&filter=all|in|out (task G12): rows for the PDF statement. */
transactionsRouter.get('/statement', requireAuth, async (req, res, next) => {
  const parsed = statementSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  try {
    res.json(await getStatement(currentUser(res).userId, parsed.data));
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
    const { userId, deviceId } = currentUser(res);
    const transaction = await getTransaction(userId, id, deviceId);
    if (!transaction) {
      res.status(404).json(NOT_FOUND);
      return;
    }
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});
