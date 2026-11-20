import { authPost, OfflineError } from './client';
import type { TransferReceipt } from './transfers';

/** What happened when the owner answered "Yes, it was me". */
export type ConfirmResult =
  | { ok: true; receipt: TransferReceipt }
  | { ok: false; reason: 'wrong_pin' | 'pin_locked' | 'expired' | 'other'; message: string };

export type RejectResult = { ok: true; cancelledAmountSen: number } | { ok: false; message: string };

type Reply = TransferReceipt & { error?: string; message?: string; cancelledAmountSen?: number };

const OFFLINE = "Can't reach MADD. Check your connection and try again.";

/** "Yes, it was me": sends the PIN; the server checks it, checks the balance again and sends the money once. */
export async function confirmHeldTransfer(id: number, pin: string): Promise<ConfirmResult> {
  try {
    const res = await authPost<Reply>(`/transfers/${id}/confirm`, { pin });
    if (res.ok) return { ok: true, receipt: res.body };
    return { ok: false, reason: confirmFailure(res.body.error), message: res.body.message ?? 'Something went wrong. Please try again.' };
  } catch (err) {
    if (err instanceof OfflineError) return { ok: false, reason: 'other', message: OFFLINE };
    throw err;
  }
}

/** "No, freeze my account": the server cancels the transfer, freezes the account and logs out every phone. */
export async function rejectHeldTransfer(id: number): Promise<RejectResult> {
  try {
    const res = await authPost<Reply>(`/transfers/${id}/reject`, {});
    if (res.ok) return { ok: true, cancelledAmountSen: res.body.cancelledAmountSen ?? 0 };
    return { ok: false, message: res.body.message ?? 'Something went wrong. Please try again.' };
  } catch (err) {
    if (err instanceof OfflineError) return { ok: false, message: OFFLINE };
    throw err;
  }
}

/** Turns the server's error code into a reason the Held screen handles. A 410 means the 5 minutes ran out. */
function confirmFailure(error: string | undefined): 'wrong_pin' | 'pin_locked' | 'expired' | 'other' {
  return error === 'wrong_pin' || error === 'pin_locked' || error === 'expired' ? error : 'other';
}
