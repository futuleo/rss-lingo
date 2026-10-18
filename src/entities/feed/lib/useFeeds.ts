import { useCallback } from 'react';
import { useAsyncData } from '@shared/lib/hooks';
import { listFeeds } from '../model/repository';

export function useFeeds() {
  const load = useCallback(() => listFeeds(), []);
  return useAsyncData(load);
}
