import { z } from 'zod';
import { fullNameField, pinField } from './register';

/** Input rules for PATCH /me. Only the name can change; email and phone are locked (people pay you with them). */
export const updateProfileSchema = z.object({ fullName: fullNameField }).strict();

/** Input rules for POST /me/pin: the current PIN, and a new one that follows the same rules as at sign-up. */
export const changePinSchema = z.object({
  currentPin: z.string().regex(/^\d{6}$/, 'PIN must be exactly 6 digits'),
  newPin: pinField,
});

export type ChangePinInput = z.infer<typeof changePinSchema>;

/** Input rules for POST /me/push-token: the Firebase token the phone got from Android. */
export const pushTokenSchema = z.object({ token: z.string().trim().min(10, 'Missing push token').max(4096) });

/** Input rules for POST /me/freeze: the PIN is optional (not needed while it is locked). */
export const freezeSchema = z.object({ pin: z.string().regex(/^\d{6}$/, 'Enter your 6-digit PIN').optional() });
