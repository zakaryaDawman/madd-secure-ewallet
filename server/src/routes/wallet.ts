import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { getWalletSummary } from '../services/wallet';

export const walletRouter = Router();

/** GET /wallet: the logged-in user's balance and recent activity. The user always comes from the token, never the request. */
walletRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const summary = await getWalletSummary(currentUser(res).userId);
    if (!summary) {
      res.status(401).json({ error: 'unauthorized', message: 'Your session has ended. Please log in again.' });
      return;
    }
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
