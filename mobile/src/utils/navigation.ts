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

/** Replaces the current screen (no going back), ignoring repeated taps. Use this instead of router.replace. */
export function replaceScreen(href: Href): void {
  if (!isTooSoon()) router.replace(href);
}
