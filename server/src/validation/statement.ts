import { z } from 'zod';

const MAX_DAYS = 366;
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-11-01').refine((d) => !Number.isNaN(Date.parse(d)), 'Not a real date');

/** Input rules for GET /transactions/statement (task G12): a Malaysian-date range of at most a year, and All / In / Out. */
export const statementSchema = z
  .object({ from: day, to: day, filter: z.enum(['all', 'in', 'out']).default('all') })
  .refine((q) => q.from <= q.to, { message: 'The start date must be before the end date', path: ['from'] })
  .refine((q) => (Date.parse(q.to) - Date.parse(q.from)) / 86_400_000 < MAX_DAYS, { message: 'Choose at most one year', path: ['to'] });

export type StatementQuery = z.infer<typeof statementSchema>;
