import { Href, router } from 'expo-router';

const LOCK_MS = 600;
let lastNavigation = 0;

/** True if another navigation happened a moment ago, so a double tap can't open the same screen twice. */
function isTooSoon(): boolean {
  const now = Date.now();
  if (now - lastNavigation < LOCK_MS) return true;
  lastNavigation = now;
  return false;
}

/** Opens a new screen on top, ignoring repeated taps. Use this instead of router.push. */
export function openScreen(href: Href): void {
  if (!isTooSoon()) router.push(href);
}

/** Closes every screen above Home and shows Home again (e.g. "Done" after a transfer). */
export function backToHome(): void {
  if (!isTooSoon()) router.dismissTo('/home');
}

/** Replaces the current screen (no going back), ignoring repeated taps. Use this instead of router.replace. */
export function replaceScreen(href: Href): void {
  if (!isTooSoon()) router.replace(href);
}

/** Closes every open screen and shows this one alone, so Back can't return to a logged-in screen (session ended). */
export function restartAt(href: Href): void {
  if (isTooSoon()) return;
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}

/** Closes screens until this one is on top again (e.g. "Try again" back to Amount). */
export function backTo(href: Href): void {
  if (!isTooSoon()) router.dismissTo(href);
}
