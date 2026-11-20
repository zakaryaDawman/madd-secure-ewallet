import { apiPost } from './client';

export type RegisterData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  pin: string;
};

/** Field names the server can report an error for. */
export type RegisterField = keyof RegisterData | 'form';

export type RegisterResult =
  | { ok: true; userId: number }
  | { ok: false; errors: Partial<Record<RegisterField, string>> };

type ServerReply = { userId?: number; fields?: Record<string, string>; message?: string };

/** Creates the account on the server. Returns the server's message for each wrong field, or one general message. */
export async function register(data: RegisterData): Promise<RegisterResult> {
  try {
    const res = await apiPost<ServerReply>('/auth/register', data);
    if (res.ok && res.body.userId) return { ok: true, userId: res.body.userId };
    if (res.body.fields) return { ok: false, errors: res.body.fields };
    return { ok: false, errors: { form: res.body.message ?? 'Something went wrong. Please try again.' } };
  } catch {
    return { ok: false, errors: { form: "Can't reach MADD. Check your connection and try again." } };
  }
}
