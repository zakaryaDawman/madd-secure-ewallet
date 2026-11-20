/** Hides most of a name so the sender can check it without seeing it in full, e.g. "Ahmad Ali" -> "Ahm*** Ali". The last word stays readable. */
export function maskName(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) return `${words[0].slice(0, 3)}***`;
  const last = words[words.length - 1];
  const masked = words.slice(0, -1).map((w) => `${w.slice(0, 3)}***`);
  return [...masked, last].join(' ');
}

/** Hides the middle of a +60 phone number, e.g. "+60123454521" -> "+60 12-*** 4521". */
export function maskPhone(phone: string): string {
  const local = phone.replace(/^\+60/, '');
  return `+60 ${local.slice(0, 2)}-*** ${local.slice(-4)}`;
}

/** First word of a name, for the round "Recent" avatars, e.g. "Ahmad Ali" -> "Ahmad". */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0];
}
