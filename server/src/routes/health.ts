import { Router } from 'express';
import { isDatabaseUp } from '../db/pool';

export const healthRouter = Router();

/** GET /health: tells the app the server is running and whether the database is reachable. */
healthRouter.get('/', async (_req, res) => {
  const db = await isDatabaseUp();
  res.status(db ? 200 : 503).json({ ok: db, db });
});
