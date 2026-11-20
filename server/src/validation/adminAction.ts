import { z } from 'zod';

/** Every admin action needs a written reason (design 25), saved forever in the security log. */
export const adminReasonSchema = z.object({
  reason: z.string().trim().min(10, 'Write a reason of at least 10 characters').max(300, 'Keep the reason under 300 characters'),
});
