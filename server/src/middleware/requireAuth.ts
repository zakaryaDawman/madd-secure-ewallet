import type { NextFunction, Request, Response } from 'express';
import { TokenClaims, verifyToken } from '../auth/tokens';

/** Reads the logged-in user that requireAuth stored on this request. Only call it in routes protected by requireAuth. */
export function currentUser(res: Response): TokenClaims {
  return res.locals.auth as TokenClaims;
}

/** Blocks the request with 401 unless it carries a valid, unexpired session token ("Authorization: Bearer ..."). */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const claims = token ? verifyToken(token) : null;

  if (!claims) {
    res.status(401).json({ error: 'unauthorized', message: 'Your session has ended. Please log in again.' });
    return;
  }
  res.locals.auth = claims;
  next();
}
