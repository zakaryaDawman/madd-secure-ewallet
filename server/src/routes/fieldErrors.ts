import type { ZodError } from 'zod';

/** Turns zod errors into one message per field, e.g. { pin: "PIN must be exactly 6 digits" }. */
export function fieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    fields[key] ??= issue.message;
  }
  return fields;
}
