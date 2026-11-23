// Runs in every test file: emails go to this fake inbox instead of Gmail, so npm test never sends a real email.
import { setMailSender, type Mail } from '../src/services/mailer';
import { codeEmailsSettled } from '../src/services/emailOtp';

export const mailbox: Mail[] = [];

beforeEach(() => {
  mailbox.length = 0;
  setMailSender(async (mail) => {
    mailbox.push(mail);
    return true;
  });
});

// Lets each test's background code emails finish before the next test empties the tables.
afterEach(() => codeEmailsSettled());

/** The 6-digit code in the newest email sent to this address (waits for background emails first). */
export async function lastCode(to: string): Promise<string> {
  await codeEmailsSettled();
  const mail = [...mailbox].reverse().find((m) => m.to === to);
  const code = mail?.text.match(/\b\d{6}\b/)?.[0];
  if (!code) throw new Error(`No code emailed to ${to}`);
  return code;
}
