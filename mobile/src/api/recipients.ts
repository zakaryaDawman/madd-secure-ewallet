import { authGet, authGetResult, OfflineError } from './client';

/** Someone the user can pay. Only masked details, as sent by the server. */
export type Recipient = {
  phone: string;
  maskedName: string;
  maskedPhone: string;
};

export type RecentRecipient = Recipient & { firstName: string };

export type LookupResult = { ok: true; recipient: Recipient } | { ok: false; message: string };

/** Looks up a MADD user by phone. Returns the masked recipient, or the server's message (not found, own number, too many searches). */
export async function lookupRecipient(phone: string): Promise<LookupResult> {
  try {
    const res = await authGetResult<Recipient & { message?: string }>(`/users/lookup?phone=${encodeURIComponent(phone)}`);
    if (res.ok) return { ok: true, recipient: res.body };
    return { ok: false, message: res.body.message ?? 'Something went wrong. Please try again.' };
  } catch (err) {
    if (err instanceof OfflineError) return { ok: false, message: "Can't reach MADD. Check your connection." };
    throw err;
  }
}

/** The last people the user sent money to. Empty list if it can't be loaded. */
export async function getRecentRecipients(): Promise<RecentRecipient[]> {
  try {
    return await authGet<RecentRecipient[]>('/users/recent');
  } catch {
    return [];
  }
}
