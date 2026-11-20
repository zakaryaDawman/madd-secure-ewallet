import { Router, type Response } from 'express';
import { currentUser } from '../middleware/requireAuth';
import { adminReasonSchema } from '../validation/adminAction';
import { listUsers, USER_FILTERS, type UserFilter } from '../services/adminUserList';
import { getUserDetail } from '../services/adminUserDetail';
import { freezeUser, trustUserDevice, unfreezeUser, type AdminActionResult } from '../services/adminActions';
import { fieldErrors } from './fieldErrors';

/** /admin/users routes. Mounted inside the admin router, so only admins ever reach them. */
export const adminUsersRouter = Router();

/** HTTP status and message for each refused admin action. */
const REFUSALS = {
  not_found: { status: 404, message: "We couldn't find this customer or device." },
  not_frozen: { status: 409, message: 'This account is not frozen.' },
  already_frozen: { status: 409, message: 'This account is already frozen.' },
  already_trusted: { status: 409, message: 'This device is already trusted.' },
} as const;

/** Reads a positive whole-number id from the path, or null. */
function idFrom(raw: unknown): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Sends 204 for a done action, or the reason it was refused. */
function sendResult(res: Response, result: AdminActionResult): void {
  if (result.ok) {
    res.status(204).end();
    return;
  }
  res.status(REFUSALS[result.error].status).json({ error: result.error, message: REFUSALS[result.error].message });
}

/** GET /admin/users?q=&filter=all|frozen|locked: the Users list (design 24). */
adminUsersRouter.get('/', async (req, res, next) => {
  const search = typeof req.query.q === 'string' ? req.query.q.slice(0, 60) : '';
  const filter: UserFilter = (USER_FILTERS as readonly unknown[]).includes(req.query.filter) ? (req.query.filter as UserFilter) : 'all';
  try {
    res.json(await listUsers(search, filter));
  } catch (err) {
    next(err);
  }
});

/** GET /admin/users/:id: one customer's details (design 23). */
adminUsersRouter.get('/:id', async (req, res, next) => {
  try {
    const id = idFrom(req.params.id);
    const detail = id ? await getUserDetail(id) : null;
    if (!detail) {
      res.status(404).json({ error: 'not_found', message: REFUSALS.not_found.message });
      return;
    }
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

/**
 * Builds a POST route for an admin action that needs a written reason. The admin's id comes from the token,
 * never from the request, so the log always names the real admin.
 */
function reasonAction(run: (adminId: number, userId: number, reason: string, deviceId: string) => Promise<AdminActionResult>) {
  return async (req: { params: Record<string, string>; body: unknown }, res: Response, next: (err: unknown) => void) => {
    const parsed = adminReasonSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
      return;
    }
    const userId = idFrom(req.params.id);
    if (!userId) {
      res.status(404).json({ error: 'not_found', message: REFUSALS.not_found.message });
      return;
    }
    try {
      sendResult(res, await run(currentUser(res).userId, userId, parsed.data.reason, req.params.deviceId ?? ''));
    } catch (err) {
      next(err);
    }
  };
}

/** POST /admin/users/:id/unfreeze { reason } (design 25). */
adminUsersRouter.post('/:id/unfreeze', reasonAction((adminId, userId, reason) => unfreezeUser(adminId, userId, reason)));

/** POST /admin/users/:id/freeze { reason }. */
adminUsersRouter.post('/:id/freeze', reasonAction((adminId, userId, reason) => freezeUser(adminId, userId, reason)));

/** POST /admin/users/:id/devices/:deviceId/trust { reason }. */
adminUsersRouter.post('/:id/devices/:deviceId/trust', reasonAction((adminId, userId, reason, deviceId) => trustUserDevice(adminId, userId, deviceId, reason)));
