import { useEffect, useState } from 'react';

/**
 * Counts down once a second from `startSeconds` (given by the server, so a wrong phone clock can't change it)
 * and calls `onDone` once it reaches 0. Returns the seconds left.
 */
export function useCountdown(startSeconds: number, onDone: () => void): number {
  const [left, setLeft] = useState(startSeconds);

  useEffect(() => {
    const endsAt = Date.now() + startSeconds * 1000;
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(tick);
        onDone();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [startSeconds, onDone]);

  return left;
}

/** Writes seconds as m:ss, e.g. 299 -> "4:59". */
export function minutesAndSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
