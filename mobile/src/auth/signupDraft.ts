import type { RegisterField } from '../api/auth';

/** The sign-up details typed on "Create account", kept in memory only until the PIN step sends them. Never saved on the phone. */
export type SignupDraft = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  inviteCode: string; // set on "I have an invite" (task G10): the PIN step accepts the invite instead of registering
  errors: Partial<Record<RegisterField, string>>;
};

const empty: SignupDraft = { fullName: '', email: '', phone: '', password: '', inviteCode: '', errors: {} };
let draft: SignupDraft = { ...empty };

/** Returns the current sign-up details. */
export function getSignupDraft(): SignupDraft {
  return draft;
}

/** Updates part of the sign-up details. */
export function updateSignupDraft(changes: Partial<SignupDraft>): void {
  draft = { ...draft, ...changes };
}

/** Wipes the sign-up details, including the password, once sign-up finishes. */
export function clearSignupDraft(): void {
  draft = { ...empty };
}
