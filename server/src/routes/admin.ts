import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { adminName } from '../services/admin';
import { adminStats } from '../services/adminStats';
import { getFlagged, listFlagged, STATUS_FILTERS, type StatusFilter } from '../services/flagged';
import type { Rule } from '../services/flaggedRows';

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

/** GET /admin/stats: the dashboard numbers (design 20): 4 counters, alerts by rule for 7 days, latest events. */
adminRouter.get('/stats', async (_req, res, next) => {
  try {
    res.json(await adminStats());
  } catch (err) {
    next(err);
  }
});

/** Reads ?rule= (R1–R4); anything else means all rules. */
function ruleFrom(value: unknown): Rule | null {
  return value === 'R1' || value === 'R2' || value === 'R3' || value === 'R4' ? value : null;
}

/** Reads ?status=; anything else means every status. */
function statusFrom(value: unknown): StatusFilter | null {
  return (STATUS_FILTERS as readonly unknown[]).includes(value) ? (value as StatusFilter) : null;
}

/** GET /admin/flagged?rule=R1..R4&status=pending|confirmed|rejected|expired|locked: the Flagged list (design 21). */
adminRouter.get('/flagged', async (req, res, next) => {
  try {
    res.json({ items: await listFlagged(ruleFrom(req.query.rule), statusFrom(req.query.status)) });
  } catch (err) {
    next(err);
  }
});

/** GET /admin/flagged/:id: one flagged event, read-only, with the exact calculation and timeline (design 48). */
adminRouter.get('/flagged/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const detail = Number.isInteger(id) && id > 0 ? await getFlagged(id) : null;
    if (!detail) {
      res.status(404).json({ error: 'not_found', message: "We couldn't find this flagged event." });
      return;
    }
    res.json(detail);
  } catch (err) {
    next(err);
  }
});
