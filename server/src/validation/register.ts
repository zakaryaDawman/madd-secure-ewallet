import { z } from 'zod';

/** Turns a Malaysian mobile number into one standard form, e.g. "012 345 6789" -> "+60123456789". Returns null if invalid. */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '').replace(/^\+?60/, '0');
  if (!/^01\d{8,9}$/.test(digits)) return null;
  return `+6${digits}`;
}

/** True for PINs that are easy to guess: all the same digit (111111) or counting up/down (123456, 654321). */
export function isWeakPin(pin: string): boolean {
  if (/^(\d)\1+$/.test(pin)) return true;
  const steps = [...pin].slice(1).map((d, i) => Number(d) - Number(pin[i]));
  return steps.every((s) => s === 1) || steps.every((s) => s === -1);
}

/** Input rules for POST /auth/register. Phone is converted to +60 form, email to lowercase. */
export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(80, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z
    .string()
    .transform((value, ctx) => {
      const phone = normalisePhone(value);
      if (!phone) {
        ctx.addIssue({ code: 'custom', message: 'Enter a Malaysian mobile number, e.g. 012 345 6789' });
        return z.NEVER;
      }
      return phone;
    }),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number'),
  pin: z
    .string()
    .regex(/^\d{6}$/, 'PIN must be exactly 6 digits')
    .refine((pin) => !isWeakPin(pin), 'This PIN is too easy to guess'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
