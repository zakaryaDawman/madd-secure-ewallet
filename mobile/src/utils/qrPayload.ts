/** Every MADD QR starts with this, so the scanner can refuse other QR codes (links, Wi-Fi, other wallets). */
const PREFIX = 'madd:';

/** Text stored inside my Receive QR: only my phone number, e.g. "madd:+60123456789". */
export function toQrText(phone: string): string {
  return `${PREFIX}${phone}`;
}

/** Reads the phone number out of a scanned QR, or returns null if it isn't a MADD QR. The server still checks the number. */
export function phoneFromQr(text: string): string | null {
  if (!text.startsWith(PREFIX)) return null;
  const phone = text.slice(PREFIX.length);
  return /^\+60\d{9,10}$/.test(phone) ? phone : null;
}

/** Shows a +60 number the way people read it, e.g. "+60123456789" -> "+60 12-345 6789". */
export function formatPhone(phone: string): string {
  const local = phone.replace(/^\+60/, '');
  return `+60 ${local.slice(0, 2)}-${local.slice(2, -4)} ${local.slice(-4)}`;
}
