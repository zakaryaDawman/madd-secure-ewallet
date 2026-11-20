import { Router } from 'express';
import { ZodError } from 'zod';
import { registerSchema } from '../validation/register';
import { createUserWithWallet, DuplicateAccountError } from '../services/users';

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

/** Turns zod errors into one message per field, e.g. { pin: "PIN must be exactly 6 digits" }. */
function fieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    fields[key] ??= issue.message;
  }
  return fields;
}
