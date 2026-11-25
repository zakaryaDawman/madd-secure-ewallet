import { authPost, OfflineError } from './client';

/** What a phone-change step returns: ok, or the message to show (and whether the PIN or code was the problem). */
export type PhoneStepResult<Extra = object> = ({ ok: true } & Extra) | { ok: false; message: string; error?: string };

type Reply = { sentTo?: string; message?: string; error?: string; fields?: Record<string, string> };

const OFFLINE = { ok: false as const, message: "Can't reach MADD. Check your connection." };

/** Turns a refused reply into the one message the screen shows. */
function refused(body: Reply): { ok: false; message: string; error?: string } {
  const field = body.fields ? Object.values(body.fields)[0] : undefined;
  return { ok: false, message: field ?? body.message ?? 'Something went wrong. Please try again.', error: body.error };
}

/** Sends one step to the server; the server decides everything (FR-10). */
async function step(path: string, data: object): Promise<PhoneStepResult<{ sentTo?: string }>> {
  try {
    const res = await authPost<Reply>(path, data);
    return res.ok ? { ok: true, sentTo: res.body.sentTo } : refused(res.body);
  } catch (err) {
    if (err instanceof OfflineError) return OFFLINE;
    throw err;
  }
}

/** Step 1 (task G11): new number + PIN. The server emails me a code and says where it went (masked). */
export function startPhoneChange(phone: string, pin: string) {
  return step('/me/phone', { phone, pin });
}

/** Step 2: the 6-digit code from my email. When it is right, the new number is saved. */
export function confirmPhoneChange(code: string) {
  return step('/me/phone/confirm', { code });
}

/** "Resend code" for the same new number. */
export async function resendPhoneCode(): Promise<{ ok: boolean; message?: string }> {
  const result = await step('/me/phone/resend', {});
  return result.ok ? { ok: true, message: 'We sent a new code.' } : { ok: false, message: result.message };
}
