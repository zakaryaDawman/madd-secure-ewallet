// MADD colours (same values as mobile/src/theme/).
const BLUE = '#1E4FD8';
const INK = '#0B1B3F';
const MUTED = '#5A6788';
const BACKGROUND = '#F4F7FC';

/** Makes text safe to put inside HTML (stops <script> and broken tags). */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Wraps a title and plain-text paragraphs in the MADD email layout. All text is escaped. */
export function brandedEmail(title: string, paragraphs: string[]): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.5;color:${INK}">${escapeHtml(p)}</p>`).join('');
  return `<!doctype html><html><body style="margin:0;padding:24px;background:${BACKGROUND};font-family:Arial,sans-serif">
<div style="max-width:480px;margin:0 auto">
<div style="font-size:28px;font-weight:bold;color:${BLUE};margin-bottom:16px">madd</div>
<div style="background:#FFFFFF;border-radius:16px;padding:24px">
<h1 style="margin:0 0 16px;font-size:20px;color:${INK}">${escapeHtml(title)}</h1>
${body}
</div>
<p style="font-size:12px;color:${MUTED};margin-top:16px">MADD will never ask for your password or PIN by email.</p>
</div></body></html>`;
}
