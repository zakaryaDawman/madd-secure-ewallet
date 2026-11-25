import { z } from 'zod';
import { phoneField } from './register';

/** Input rules for POST /me/phone (task G11): the new number and my PIN. */
export const startPhoneChangeSchema = z.object({ phone: phoneField, pin: z.string().regex(/^\d{6}$/, 'Enter your 6-digit PIN') }).strict();

/** Input rules for POST /me/phone/confirm: the 6-digit code from my email. */
export const confirmPhoneChangeSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your email') }).strict();
