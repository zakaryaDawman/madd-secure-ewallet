import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getUnreadCounts } from '../api/notifications';

/** True when the Inbox has anything unread. Asks the server each time the screen comes into view. */
export function useInboxDot(): boolean {
  const [hasUnread, setHasUnread] = useState(false);
  useFocusEffect(
    useCallback(() => {
      getUnreadCounts()
        .then((counts) => setHasUnread(counts.all + counts.security > 0))
        .catch(() => undefined); // offline: keep the last answer
    }, []),
  );
  return hasUnread;
}
