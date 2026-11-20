import type { Recipient } from '../api/recipients';
import type { TransferReceipt } from '../api/transfers';

/** The transfer being prepared across Amount → Review → Checking → Sent. Kept in memory only; the PIN is wiped right after sending. */
export type TransferDraft = {
  recipient: Recipient | null;
  amountSen: number;
  note: string;
  pin: string;
  pinError: string; // shown on the PIN sheet after a wrong PIN
  receipt: TransferReceipt | null;
};

const empty: TransferDraft = { recipient: null, amountSen: 0, note: '', pin: '', pinError: '', receipt: null };
let draft: TransferDraft = { ...empty };

/** Returns the transfer being prepared. */
export function getTransferDraft(): TransferDraft {
  return draft;
}

/** Updates part of the transfer being prepared. */
export function updateTransferDraft(changes: Partial<TransferDraft>): void {
  draft = { ...draft, ...changes };
}

/** Starts a new transfer to this person, forgetting any previous one. */
export function startTransfer(recipient: Recipient): void {
  draft = { ...empty, recipient };
}
