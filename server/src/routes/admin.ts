import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { adminName } from '../services/admin';
import { adminStats } from '../services/adminStats';
import { getFlagged, listFlagged, STATUS_FILTERS, type StatusFilter } from '../services/flagged';
import type { Rule } from '../services/flaggedRows';
import { readSecurityLog } from '../services/securityLogRead';
import { adminUsersRouter } from './adminUsers';

export const adminRouter = Router();

// Runs before every route below, and for unknown /admin paths too, so customers always get 401/403, never 404.
adminRouter.use(requireAuth, requireRole('admin'));

// Users, unfreeze, freeze and trust (task E4), behind the same admin-only guard.
adminRouter.use('/users', adminUsersRouter);

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

/**
 * GET /admin/logs?q=…&before=…: the security log, newest first, 50 at a time, searchable by user or rule (design 22).
 * Read-only: there is no route to change it, and the database refuses any edit or delete.
 */
adminRouter.get('/logs', async (req, res, next) => {
  const search = typeof req.query.q === 'string' ? req.query.q.slice(0, 60) : '';
  const before = Number(req.query.before);
  try {
    res.json(await readSecurityLog(search, Number.isInteger(before) && before > 0 ? before : null));
  } catch (err) {
    next(err);
  }
});
