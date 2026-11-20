import { z } from 'zod';

export const MIN_TRANSFER_SEN = 100; // RM 1.00
export const MAX_TRANSFER_SEN = 5_000_000; // RM 50,000.00

/** A typed PIN: exactly 6 digits (whether it is the right PIN is checked later, against the hash). */
const typedPin = z.string().regex(/^\d{6}$/, 'Enter your 6-digit PIN');

/** Input rules for POST /transfers. The amount is whole sen, so RM 12.50 is sent as 1250. */
export const transferSchema = z.object({
  recipientPhone: z.string().min(1, 'Choose who to send to'),
  amountSen: z
    .number({ message: 'Enter an amount' })
    .max(MAX_TRANSFER_SEN, 'The largest transfer is RM 50,000.00')
    .min(MIN_TRANSFER_SEN, 'The smallest transfer is RM 1.00')
    .int('Amount must be in whole sen'),
  note: z.string().trim().max(50, 'Keep the note under 50 characters').optional(),
  pin: typedPin,
});

export type TransferInput = z.infer<typeof transferSchema>;

/** Input rules for POST /transfers/:id/confirm ("Yes, it was me"). */
export const confirmHoldSchema = z.object({ pin: typedPin });
