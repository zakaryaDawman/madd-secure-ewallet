import { sendMail } from '../src/services/mailer';
import { brandedEmail } from '../src/services/mailTemplate';

/** Sends one test email to the address given on the command line: npm run mail:test -- you@example.com */
async function main(): Promise<void> {
  const to = process.argv[2];
  if (!to) {
    console.log('Usage: npm run mail:test -- you@example.com');
    process.exit(1);
  }
  const title = 'MADD test email';
  const lines = ['If you can read this, MADD can send emails.'];
  const ok = await sendMail(to, title, lines.join('\n'), brandedEmail(title, lines));
  console.log(ok ? `Sent to ${to}` : 'Failed (see the error code above)');
  process.exit(ok ? 0 : 1);
}

void main();
