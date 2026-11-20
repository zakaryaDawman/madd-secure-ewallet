import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getInbox, type PendingCard } from '../api/notifications';

/** My newest held transfer that I can decide on (from the server), or null. Reloads each time the screen is shown. */
export function useHeldTransfer(): { held: PendingCard | null; recheck: () => void } {
  const [held, setHeld] = useState<PendingCard | null>(null);

  const recheck = useCallback(() => {
    getInbox('security')
      .then((page) => setHeld(page.pending.find((c) => c.canDecide) ?? null))
      .catch(() => undefined); // offline: Home shows the offline view
  }, []);

  useFocusEffect(recheck);
  return { held, recheck };
}
