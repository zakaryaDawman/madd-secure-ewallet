import { z } from 'zod';
import { adminReasonSchema } from './adminAction';
import { emailField, fullNameField, phoneField } from './register';

/** Input rules for POST /admin/users (task G10): the new customer's details. No password or PIN: the customer sets those. */
export const addUserSchema = z.object({ fullName: fullNameField, email: emailField, phone: phoneField }).strict();

export type AddUserInput = z.infer<typeof addUserSchema>;

/** Input rules for PATCH /admin/users/:id (task G10): any of name, email, phone, plus the written reason. */
export const editUserSchema = adminReasonSchema
  .extend({ fullName: fullNameField.optional(), email: emailField.optional(), phone: phoneField.optional() })
  .strict()
  .refine((input) => input.fullName !== undefined || input.email !== undefined || input.phone !== undefined, {
    message: 'Change at least one detail',
    path: ['fullName'],
  });

export type EditUserInput = z.infer<typeof editUserSchema>;
