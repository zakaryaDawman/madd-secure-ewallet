/**
 * The admin's session token, kept ONLY in memory (a JavaScript variable). Nothing is saved in the browser,
 * so a malicious script can't find it later; the price is logging in again after a page refresh.
 */
let token: string | null = null;
let onEnd: () => void = () => undefined;

/** The current token, or null when logged out. */
export function getToken(): string | null {
  return token;
}

/** Remembers the token after a successful login. */
export function startSession(newToken: string): void {
  token = newToken;
}

/** Forgets the token and tells the app to show the login page again. */
export function endSession(): void {
  token = null;
  onEnd();
}

/** Sets what happens when the session ends (the app goes back to the login page). */
export function whenSessionEnds(callback: () => void): void {
  onEnd = callback;
}
