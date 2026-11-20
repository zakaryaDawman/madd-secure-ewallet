import type { NextFunction, Request, Response } from 'express';
import { TokenClaims, verifyToken } from '../auth/tokens';
import { sessionState } from '../services/sessions';

type Refusal = 'missing_token' | 'invalid_token' | 'session_expired' | 'session_revoked' | 'account_frozen';

/** Reads the logged-in user that requireAuth stored on this request. Only call it in routes protected by requireAuth. */
export function currentUser(res: Response): TokenClaims {
  return res.locals.auth as TokenClaims;
}

/**
 * Sends 401 with a code the app can act on. The message is the same for every case, so it tells an attacker nothing,
 * except a freeze: that token belonged to the owner, so the app may say the account is frozen (design 14).
 */
function refuse(res: Response, error: Refusal) {
  const message = error === 'account_frozen' ? 'Your account is frozen.' : 'Your session has ended. Please log in again.';
  res.status(401).json({ error, message });
}

/**
 * Blocks the request with 401 unless it carries a valid token ("Authorization: Bearer ...") whose session
 * is still active in the database (not expired, not cancelled by logout or freeze).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return refuse(res, 'missing_token');

  const check = verifyToken(token);
  if (!check.ok) return refuse(res, check.reason === 'expired' ? 'session_expired' : 'invalid_token');

  try {
    const state = await sessionState(check.claims.sessionId, check.claims.userId);
    if (state === 'expired') return refuse(res, 'session_expired');
    if (state === 'revoked') return refuse(res, 'session_revoked');
    if (state === 'frozen') return refuse(res, 'account_frozen');
  } catch (err) {
    return next(err);
  }
  res.locals.auth = check.claims;
  next();
}
