import { config } from '../config';

// MADD colours (same values as mobile/src/theme/).
const BLUE = '#1E4FD8';
const INK = '#0B1B3F';
const MUTED = '#5A6788';
const BACKGROUND = '#F4F7FC';
const TINT = '#E3ECFF';

/** Makes text safe to put inside HTML (stops <script> and broken tags). */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** The one-time code, big, bold and spaced out in a blue box, so it can't be missed. */
function codeBox(code: string): string {
  return `<div style="margin:0 0 20px;padding:18px 12px;background:${TINT};border:2px solid ${BLUE};border-radius:14px;text-align:center">
<div style="font-size:13px;color:${MUTED};margin-bottom:6px">Your code</div>
<div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:${BLUE};font-family:'Courier New',monospace">${escapeHtml(code)}</div>
</div>`;
}

/**
 * Wraps a title and plain-text paragraphs in the MADD email layout. All text is escaped.
 * With a `code`, the code is shown in a highlighted box right under the title.
 */
export function brandedEmail(title: string, paragraphs: string[], code?: string): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.5;color:${INK}">${escapeHtml(p)}</p>`).join('');
  return `<!doctype html><html><body style="margin:0;padding:24px;background:${BACKGROUND};font-family:Arial,sans-serif">
<div style="max-width:480px;margin:0 auto">
<div style="font-size:28px;font-weight:bold;color:${BLUE};margin-bottom:16px">madd</div>
<div style="background:#FFFFFF;border-radius:16px;padding:24px">
<h1 style="margin:0 0 16px;font-size:20px;color:${INK}">${escapeHtml(title)}</h1>
${code ? codeBox(code) : ''}${body}
</div>
<p style="font-size:12px;color:${MUTED};margin-top:16px">MADD will never ask for your password or PIN by email.<br>Questions? Contact ${escapeHtml(config.supportEmail)} or call ${escapeHtml(config.supportHotline)}</p>
</div></body></html>`;
}
