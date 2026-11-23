import { z } from 'zod';

const email = z.string().trim().toLowerCase().min(1, 'Enter your email');

/** Input rules for POST /auth/verify-email (task G4b): the email and the 6-digit sign-up code. */
export const verifyEmailSchema = z.object({ email, code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your email') });

/** Input rules for POST /auth/resend-code (task G4b). */
export const resendCodeSchema = z.object({ email });
