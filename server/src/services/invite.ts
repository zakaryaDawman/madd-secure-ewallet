import bcrypt from 'bcrypt';
import type { AcceptInviteInput } from '../validation/verifyEmail';
import { BCRYPT_ROUNDS } from './users';
import { logSecurityEvent } from './securityLog';
import { verifySignupCode } from './signupCode';

/**
 * An admin-added customer accepts their invite (task G10): the right code from their email sets the password and PIN
 * they chose, and verifies the email, all in one transaction. False for any wrong, used, expired or locked code.
 */
export async function acceptInvite(input: AcceptInviteInput): Promise<boolean> {
  const [passwordHash, pinHash] = await Promise.all([bcrypt.hash(input.password, BCRYPT_ROUNDS), bcrypt.hash(input.pin, BCRYPT_ROUNDS)]);
  return verifySignupCode(input.email, input.code, 'INVITE', async (client, userId) => {
    await client.query('UPDATE users SET password_hash = $2, pin_hash = $3 WHERE id = $1', [userId, passwordHash, pinHash]);
    await logSecurityEvent({ userId, type: 'INVITE_ACCEPTED', reason: 'The customer used the emailed invite code and set their own password and PIN.' }, client);
  });
}
