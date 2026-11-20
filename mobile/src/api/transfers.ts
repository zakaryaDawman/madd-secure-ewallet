import { authPost, OfflineError } from './client';

export type TransferReceipt = {
  id: number;
  reference: string;
  amountSen: number;
  note: string | null;
  recipientName: string;
  newBalanceSen: number;
  createdAt: string;
};

/** Why a transfer didn't go through. `offline` means no answer came back, so we can't be sure whether the money moved. */
export type TransferFailure = 'wrong_pin' | 'insufficient_funds' | 'offline' | 'other';

export type SendResult = { ok: true; receipt: TransferReceipt } | { ok: false; reason: TransferFailure; message: string };

type Reply = TransferReceipt & { error?: string; message?: string };

/** Asks the server to send money. The server checks the PIN and the balance; the phone decides nothing. */
export async function sendTransfer(data: { recipientPhone: string; amountSen: number; note: string; pin: string }): Promise<SendResult> {
  try {
    const res = await authPost<Reply>('/transfers', data);
    if (res.ok) return { ok: true, receipt: res.body };
    const reason: TransferFailure = res.body.error === 'wrong_pin' || res.body.error === 'insufficient_funds' ? res.body.error : 'other';
    return { ok: false, reason, message: res.body.message ?? 'The transfer could not be completed.' };
  } catch (err) {
    if (err instanceof OfflineError) {
      return { ok: false, reason: 'offline', message: "We couldn't confirm this transfer. Check History before trying again." };
    }
    throw err;
  }
}
