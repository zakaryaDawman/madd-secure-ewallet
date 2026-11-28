import { Response, Router } from 'express';
import { registerSchema } from '../validation/register';
import { createUserWithWallet, DuplicateAccountError } from '../services/users';
import { loginSchema } from '../validation/login';
import { checkCredentials } from '../services/login';
import { createToken } from '../auth/tokens';
import { createSession, revokeSession } from '../services/sessions';
import { recordLoginAttempt, rememberDevice } from '../services/devices';
import { checkNewDeviceLogin } from '../services/loginRules';
import { currentLoginLock, lockAfterFailure } from '../services/loginLock';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { fieldErrors } from './fieldErrors';
import { config } from '../config';
import { emailSignupCode, sendFreshSignupCode, verifySignupCode } from '../services/signupCode';
import { acceptInviteSchema, resendCodeSchema, verifyEmailSchema } from '../validation/verifyEmail';
import { acceptInvite } from '../services/invite';

export const authRouter = Router();

/** POST /auth/register: checks the input, creates the account and its RM 1,000 wallet, and emails the sign-up code (task G4b). */
authRouter.post('/register', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }

  try {
    const { userId, code } = await createUserWithWallet(parsed.data);
    emailSignupCode(parsed.data.email, code); // after the commit: never a code for an account that wasn't saved
    res.status(201).json({ userId });
  } catch (err) {
    if (err instanceof DuplicateAccountError) {
      // Deliberately does not say whether the email or the phone matched.
      res.status(409).json({ error: 'duplicate', message: 'An account with these details already exists' });
      return;
    }
    next(err);
  }
});

/**
 * POST /auth/login: checks email + password, records the attempt and the device, starts a session and returns its
 * 30-minute token (with the device id inside, so it can't be faked). One message for any wrong detail.
 * After 5 wrong passwords in 15 minutes sign-in is locked for 15 minutes (rule R4), the same for any email.
 * A frozen account gets 423 and no session. A new phone is let in but untrusted (rule R3): its transfers wait.
 */
authRouter.post('/login', async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }

  try {
    const { email, deviceId, deviceName } = parsed.data;
    // Rule R4: while locked the password is not even checked, and the try is not recorded (it would stretch the lock).
    const lock = await currentLoginLock(email);
    if (lock.locked) return sendLoginLocked(res, lock.unlocksAt);

    const user = await checkCredentials(parsed.data);
    await recordLoginAttempt(email, deviceId, user !== null);
    if (!user) {
      const after = await lockAfterFailure(email, deviceId);
      if (after.locked) return sendLoginLocked(res, after.unlocksAt);
      res.status(401).json({ error: 'invalid_login', message: 'Email or password is wrong' });
      return;
    }
    if (!user.verified) {
      // Only told after the right password. Sends a fresh code (at most one a minute) and starts no session.
      await sendFreshSignupCode(email);
      res.status(403).json({ error: 'email_not_verified', message: 'Check your email for the code to finish creating your account.' });
      return;
    }
    if (user.frozen) {
      // Only told after the right password, so this reveals nothing to someone guessing.
      res.status(423).json({ error: 'account_frozen', message: config.frozenMessage });
      return;
    }
    await rememberDevice(user.userId, deviceId, deviceName);
    const deviceTrusted = await checkNewDeviceLogin(user.userId, deviceId, deviceName);
    const sessionId = await createSession(user.userId);
    const token = createToken({ userId: user.userId, role: user.role, sessionId, deviceId });
    res.json({ token, deviceTrusted, user: { id: user.userId, fullName: user.fullName, role: user.role } });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/verify-email (task G4b): the sign-up code. One reply for every failure, so it never shows who has an account. */
authRouter.post('/verify-email', async (req, res, next) => {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  try {
    if (await verifySignupCode(parsed.data.email, parsed.data.code)) {
      res.json({ verified: true });
      return;
    }
    res.status(400).json({ error: 'invalid_code', message: 'The code is wrong or has run out. Check it, or ask for a new one.' });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/resend-code (task G4b): the same reply whether or not a code was really sent (unknown, verified, or within 60 s). */
authRouter.post('/resend-code', async (req, res, next) => {
  const parsed = resendCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  try {
    await sendFreshSignupCode(parsed.data.email, parsed.data.invite ? 'INVITE' : 'SIGNUP');
    res.json({ message: "If this email needs a code, we've sent a new one." });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/accept-invite (task G10): invite code + the customer's own password and PIN. One reply for every failure. */
authRouter.post('/accept-invite', async (req, res, next) => {
  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }
  try {
    if (await acceptInvite(parsed.data)) {
      res.json({ accepted: true });
      return;
    }
    res.status(400).json({ error: 'invalid_code', message: 'The code is wrong or has run out. Check it, or ask for a new one.' });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/logout: cancels this session only, so its token stops working at once. Other logins stay active. */
authRouter.post('/logout', requireAuth, async (_req, res, next) => {
  try {
    await revokeSession(currentUser(res).sessionId, 'logout');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * 423 for a locked sign-in (design 27), with the time left from the server's clock. The reply is the same whether or
 * not the email has an account, so the lock can't be used to find out who uses MADD.
 */
function sendLoginLocked(res: Response, unlocksAt: Date): void {
  res.status(423).json({
    error: 'login_locked',
    message: 'Too many wrong passwords. Sign-in is paused for a few minutes.',
    unlocksAt: unlocksAt.toISOString(),
    secondsLeft: Math.ceil((unlocksAt.getTime() - Date.now()) / 1000),
  });
}
