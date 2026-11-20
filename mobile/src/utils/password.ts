export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string };

/** Rates a password from 0 to 4 for the strength bar: length, letters, numbers and symbols each add a point. */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score++;
  if (password.length >= 12) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Too weak', 'Weak', 'Okay', 'Strong', 'Very strong'];
  return { score: score as PasswordStrength['score'], label: labels[score] };
}
