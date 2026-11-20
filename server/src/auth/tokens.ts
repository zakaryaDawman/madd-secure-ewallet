import jwt from 'jsonwebtoken';
import { config } from '../config';

export const TOKEN_LIFETIME_MINUTES = 30;

/** What the server puts inside every session token. Never secrets. */
export type TokenClaims = {
  userId: number;
  role: 'customer' | 'admin';
  sessionId: string;
};

/** Result of checking a token: its claims, or why it was refused. */
export type TokenCheck = { ok: true; claims: TokenClaims } | { ok: false; reason: 'invalid' | 'expired' };

/** Creates a signed session token for one session; it expires after 30 minutes. */
export function createToken(claims: TokenClaims): string {
  return jwt.sign({ role: claims.role, sid: claims.sessionId }, config.jwtSecret, {
    subject: String(claims.userId),
    expiresIn: `${TOKEN_LIFETIME_MINUTES}m`,
    algorithm: 'HS256',
  });
}

/** Checks a token's signature and expiry, and that it names a session. Says whether a refused token was expired or invalid. */
export function verifyToken(token: string): TokenCheck {
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    if (typeof payload.sid !== 'string') return { ok: false, reason: 'invalid' };
    return { ok: true, claims: { userId: Number(payload.sub), role: payload.role, sessionId: payload.sid } };
  } catch (err) {
    return { ok: false, reason: err instanceof jwt.TokenExpiredError ? 'expired' : 'invalid' };
  }
}
