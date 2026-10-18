import { useCallback, useState } from 'react';
import { refreshAllFeeds } from './refresh-feed';

export interface UseRefreshAllFeedsResult {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export function useRefreshAllFeeds(
  reload: () => Promise<void>,
): UseRefreshAllFeedsResult {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAllFeeds();
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  return { refreshing, onRefresh };
}
