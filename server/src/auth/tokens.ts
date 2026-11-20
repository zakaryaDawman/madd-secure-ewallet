import jwt from 'jsonwebtoken';
import { config } from '../config';

export const TOKEN_LIFETIME_MINUTES = 30;

/** What the server puts inside every session token. Never secrets. */
export type TokenClaims = {
  userId: number;
  role: 'customer' | 'admin';
};

/** Creates a signed session token that expires after 30 minutes. */
export function createToken(claims: TokenClaims): string {
  return jwt.sign({ role: claims.role }, config.jwtSecret, {
    subject: String(claims.userId),
    expiresIn: `${TOKEN_LIFETIME_MINUTES}m`,
    algorithm: 'HS256',
  });
}

/** Checks a token's signature and expiry. Returns its claims, or null if it is invalid or expired. */
export function verifyToken(token: string): TokenClaims | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    return { userId: Number(payload.sub), role: payload.role };
  } catch {
    return null;
  }
}
