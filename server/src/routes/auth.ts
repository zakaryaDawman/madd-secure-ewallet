import { Router } from 'express';
import { registerSchema } from '../validation/register';
import { createUserWithWallet, DuplicateAccountError } from '../services/users';
import { loginSchema } from '../validation/login';
import { checkCredentials } from '../services/login';
import { createToken } from '../auth/tokens';
import { createSession, revokeSession } from '../services/sessions';
import { currentUser, requireAuth } from '../middleware/requireAuth';
import { fieldErrors } from './fieldErrors';

export const authRouter = Router();

/** POST /auth/register: checks the input, then creates the account and its RM 1,000 wallet. */
authRouter.post('/register', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }

  try {
    const userId = await createUserWithWallet(parsed.data);
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

/** POST /auth/login: checks email + password, starts a session and returns its 30-minute token. One message for any wrong detail. */
authRouter.post('/login', async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation', fields: fieldErrors(parsed.error) });
    return;
  }

  try {
    const user = await checkCredentials(parsed.data);
    if (!user) {
      res.status(401).json({ error: 'invalid_login', message: 'Email or password is wrong' });
      return;
    }
    const sessionId = await createSession(user.userId);
    const token = createToken({ userId: user.userId, role: user.role, sessionId });
    res.json({ token, user: { id: user.userId, fullName: user.fullName, role: user.role } });
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
