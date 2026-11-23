import nodemailer from 'nodemailer';
import { config } from '../config';

export type Mail = { to: string; subject: string; text: string; html: string };

/** Something that delivers one email and says whether it worked (Gmail SMTP, or a fake in tests). */
export type MailSender = (mail: Mail) => Promise<boolean>;

// undefined = not made yet; made once on the first email.
let sender: MailSender | undefined;

/**
 * Sends one email. Returns true if the mail server accepted it, false otherwise.
 * Never throws, so a failed email can't crash the request that sent it.
 * Never logs the password, the message text or any code inside it.
 */
export async function sendMail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  try {
    sender ??= smtpSender();
    return await sender({ to, subject, text, html });
  } catch (err) {
    console.error('Email failed:', errorCode(err));
    return false;
  }
}

/** Replaces how emails are delivered (tests use a fake instead of Gmail). */
export function setMailSender(fake: MailSender | undefined): void {
  sender = fake;
}

/** Builds the real sender: Gmail SMTP, upgraded to TLS before logging in (STARTTLS). */
function smtpSender(): MailSender {
  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    requireTLS: true,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  return async (mail) => {
    const info = await transport.sendMail({ from: config.mailFrom, ...mail });
    return info.accepted.length > 0;
  };
}

/** A short, safe description of a mail error (its code), never the full error with message contents. */
function errorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) return String(err.code);
  return 'unknown error';
}
