import { authPost, OfflineError } from './client';
import type { TransferReceipt } from './transfers';

/** What happened when the owner answered "Yes, it was me". */
export type ConfirmResult =
  | { ok: true; receipt: TransferReceipt }
  | { ok: false; reason: ConfirmFailure; message: string };

/** Why "Yes" was refused. A code problem sends the sheet back to the code step; code_locked means only "No" is left. */
export type ConfirmFailure = 'wrong_pin' | 'pin_locked' | 'expired' | 'wrong_code' | 'code_expired' | 'code_locked' | 'other';

export type ResendResult = { ok: true } | { ok: false; message: string; secondsLeft?: number };

export type RejectResult = { ok: true; cancelledAmountSen: number } | { ok: false; message: string };

type Reply = TransferReceipt & { error?: string; message?: string; cancelledAmountSen?: number; secondsLeft?: number };

const OFFLINE = "Can't reach MADD. Check your connection and try again.";

/** "Yes, it was me": sends the PIN and the emailed code; the server checks both, checks the balance again and sends the money once. */
export async function confirmHeldTransfer(id: number, pin: string, code: string): Promise<ConfirmResult> {
  try {
    const res = await authPost<Reply>(`/transfers/${id}/confirm`, { pin, code });
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

/** "Resend code": asks the server to email a new code (it allows one every 60 seconds, at most 3 emails). */
export async function resendHoldCode(id: number): Promise<ResendResult> {
  try {
    const res = await authPost<Reply>(`/transfers/${id}/resend-code`, {});
    if (res.ok) return { ok: true };
    return { ok: false, message: res.body.message ?? 'Something went wrong. Please try again.', secondsLeft: res.body.secondsLeft };
  } catch (err) {
    if (err instanceof OfflineError) return { ok: false, message: OFFLINE };
    throw err;
  }
}

const KNOWN_FAILURES: ConfirmFailure[] = ['wrong_pin', 'pin_locked', 'expired', 'wrong_code', 'code_expired', 'code_locked'];

/** Turns the server's error code into a reason the Held screen handles. A 410 "expired" means the 5 minutes ran out. */
function confirmFailure(error: string | undefined): ConfirmFailure {
  return KNOWN_FAILURES.find((f) => f === error) ?? 'other';
}

/** Which step of the release sheet a refusal is about: code problems go back to the code, everything else to the PIN. */
export function failureStep(reason: ConfirmFailure): 'code' | 'pin' {
  return reason === 'wrong_code' || reason === 'code_expired' || reason === 'code_locked' ? 'code' : 'pin';
}
