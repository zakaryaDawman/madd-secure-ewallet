import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { adminName } from '../services/admin';

export const adminRouter = Router();

// Runs before every route below, and for unknown /admin paths too, so customers always get 401/403, never 404.
adminRouter.use(requireAuth, requireRole('admin'));

/** GET /admin/me: the logged-in admin's name (the admin console header uses it). */
adminRouter.get('/me', async (_req, res, next) => {
  try {
    res.json({ fullName: await adminName(currentUser(res).userId) });
  } catch (err) {
    next(err);
  }
});
