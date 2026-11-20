import { z } from 'zod';

/** Input rules for POST /auth/login. The password is checked against the database; the device id is made once by the phone. */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Enter your email'),
  password: z.string().min(1, 'Enter your password'),
  deviceId: z.string().uuid('Missing device id'),
  deviceName: z.string().trim().min(1).max(60).catch('Unknown device'),
});

export type LoginInput = z.infer<typeof loginSchema>;
