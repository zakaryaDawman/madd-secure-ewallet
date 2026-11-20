import { Router } from 'express';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { INBOX_TABS, InboxTab, listInbox, markTabRead, pendingCards, unreadCounts } from '../services/inbox';

export const notificationsRouter = Router();

/** Reads ?tab= (or the body's tab); anything else than all / security counts as all. */
function tabFrom(value: unknown): InboxTab {
  return (INBOX_TABS as readonly unknown[]).includes(value) ? (value as InboxTab) : 'all';
}

/** GET /notifications?tab=all|security: one Inbox tab, the waiting-transfer cards (Security) and the unread counts. */
notificationsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const { userId, deviceId } = currentUser(res);
    const tab = tabFrom(req.query.tab);
    const [items, pending, unread] = await Promise.all([
      listInbox(userId, deviceId, tab),
      tab === 'security' ? pendingCards(userId, deviceId) : Promise.resolve([]),
      unreadCounts(userId),
    ]);
    res.json({ items, pending, unread });
  } catch (err) {
    next(err);
  }
});

/** GET /notifications/unread: how many unread items each tab has (for the red dot on the Inbox tab). */
notificationsRouter.get('/unread', requireAuth, async (_req, res, next) => {
  try {
    res.json(await unreadCounts(currentUser(res).userId));
  } catch (err) {
    next(err);
  }
});

/** POST /notifications/read { tab }: marks a tab as read when the user opens it. */
notificationsRouter.post('/read', requireAuth, async (req, res, next) => {
  try {
    await markTabRead(currentUser(res).userId, tabFrom(req.body?.tab));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
