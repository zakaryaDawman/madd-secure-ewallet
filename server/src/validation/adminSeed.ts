import { z } from 'zod';
import { fullNameField, normalisePhone } from './register';

/** Rules for the ADMIN_* values in .env. The admin password must be stronger than a customer's. */
export const adminSeedSchema = z.object({
  ADMIN_EMAIL: z.string().trim().toLowerCase().email('ADMIN_EMAIL is not a valid email'),
  ADMIN_PASSWORD: z
    .string()
    .min(12, 'ADMIN_PASSWORD needs at least 12 characters')
    .regex(/[A-Za-z]/, 'ADMIN_PASSWORD needs a letter')
    .regex(/\d/, 'ADMIN_PASSWORD needs a number'),
  ADMIN_NAME: fullNameField,
  ADMIN_PHONE: z.string().transform((value, ctx) => {
    const phone = normalisePhone(value);
    if (!phone) {
      ctx.addIssue({ code: 'custom', message: 'ADMIN_PHONE is not a Malaysian mobile number' });
      return z.NEVER;
    }
    return phone;
  }),
});

export type AdminSeedInput = z.infer<typeof adminSeedSchema>;
