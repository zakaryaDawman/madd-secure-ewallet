import type { NextFunction, Request, Response } from 'express';
import type { TokenClaims } from '../auth/tokens';
import { currentUser } from './requireAuth';
import { userRole } from '../services/users';

/**
 * Builds a guard that lets only users with this role through, else 403. Use it after requireAuth.
 * The role is read from the database on every request, not trusted from the token, so a demoted admin loses access at once.
 */
export function requireRole(role: TokenClaims['role']) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      if ((await userRole(currentUser(res).userId)) !== role) {
        res.status(403).json({ error: 'forbidden', message: 'You do not have access to this page.' });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
