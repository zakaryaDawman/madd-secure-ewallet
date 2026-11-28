import { parseAddress, sendMail, setMailSender, type Mail } from '../src/services/mailer';
import { brandedEmail, escapeHtml } from '../src/services/mailTemplate';

afterEach(() => setMailSender(undefined));

describe('sendMail (G3)', () => {
  it('hands the email to the sender and reports success', async () => {
    const sent: Mail[] = [];
    setMailSender(async (mail) => {
      sent.push(mail);
      return true;
    });
    const ok = await sendMail('owner@madd.test', 'Hello', 'plain text', '<p>html</p>');
    expect(ok).toBe(true);
    expect(sent).toEqual([{ to: 'owner@madd.test', subject: 'Hello', text: 'plain text', html: '<p>html</p>' }]);
  });

  it('returns false instead of crashing when sending fails', async () => {
    setMailSender(async () => {
      throw Object.assign(new Error('secret body 123456'), { code: 'EAUTH' });
    });
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const ok = await sendMail('owner@madd.test', 'Code', 'Your code is 123456', '<p>123456</p>');
    expect(ok).toBe(false);
    expect(log).toHaveBeenCalledWith('Email failed:', 'EAUTH');
    expect(JSON.stringify(log.mock.calls)).not.toContain('123456');
    log.mockRestore();
  });

  it('returns false when the mail server accepts nobody', async () => {
    setMailSender(async () => false);
    expect(await sendMail('owner@madd.test', 'Hi', 'x', 'x')).toBe(false);
  });
});

describe('brandedEmail (G3)', () => {
  it('shows the title and paragraphs in MADD colours', () => {
    const html = brandedEmail('Your code', ['Line one', 'Line two']);
    expect(html).toContain('Your code');
    expect(html).toContain('Line two');
    expect(html).toContain('#1E4FD8');
    expect(html).toContain('Questions? Contact maddwallet622@gmail.com or call 011-6437 9383');
  });

  it('shows a one-time code big and bold in a blue box, once', () => {
    const html = brandedEmail('Your code', ['Enter it in MADD.'], '048213');
    expect(html).toMatch(/font-size:36px;font-weight:bold;letter-spacing:10px;color:#1E4FD8[^>]*>048213</);
    expect(html.match(/048213/g)).toHaveLength(1);
    expect(brandedEmail('No code', ['Hi'])).not.toContain('Your code</div>');
  });

  it('escapes HTML so text cannot inject tags', () => {
    expect(brandedEmail('<script>x</script>', ['<b>"hi"</b>'])).not.toContain('<script>');
    expect(escapeHtml(`<a href="x">'`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;');
  });
});

describe('parseAddress (Brevo sender)', () => {
  it('reads a name and an address, or a bare address', () => {
    expect(parseAddress('MADD <maddwallet622@gmail.com>')).toEqual({ name: 'MADD', email: 'maddwallet622@gmail.com' });
    expect(parseAddress('"MADD Wallet" <a@b.com>')).toEqual({ name: 'MADD Wallet', email: 'a@b.com' });
    expect(parseAddress('a@b.com')).toEqual({ email: 'a@b.com' });
  });
});
