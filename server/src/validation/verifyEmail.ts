import { z } from 'zod';
import { passwordField, pinField } from './register';

const email = z.string().trim().toLowerCase().min(1, 'Enter your email');

/** Input rules for POST /auth/verify-email (task G4b): the email and the 6-digit sign-up code. */
export const verifyEmailSchema = z.object({ email, code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your email') });

/** Input rules for POST /auth/resend-code (task G4b). `invite: true` resends an admin's invite code instead (task G10). */
export const resendCodeSchema = z.object({ email, invite: z.boolean().optional() });

/** Input rules for POST /auth/accept-invite (task G10): the invite code, plus the password and PIN the customer chooses. */
export const acceptInviteSchema = verifyEmailSchema.extend({ password: passwordField, pin: pinField });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
