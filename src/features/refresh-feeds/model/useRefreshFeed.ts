import { useCallback, useState } from 'react';
import { getFeedById } from '@entities/feed';
import { refreshFeed } from './refresh-feed';

export interface UseRefreshFeedResult {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export function useRefreshFeed(
  feedId: number,
  reload: () => Promise<void>,
): UseRefreshFeedResult {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const feed = await getFeedById(feedId);
      if (feed) {
        await refreshFeed(feed);
      }
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [feedId, reload]);

  return { refreshing, onRefresh };
}
