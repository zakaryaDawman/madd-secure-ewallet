import { z } from 'zod';

/** Input rules for POST /auth/login. Only checks that both fields are filled in; the password itself is checked against the database. */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Enter your email'),
  password: z.string().min(1, 'Enter your password'),
});

export type LoginInput = z.infer<typeof loginSchema>;
