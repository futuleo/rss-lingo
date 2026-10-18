import { useCallback } from 'react';
import { useAsyncData } from '@shared/lib/hooks';
import { getFeedById } from '../model/repository';

export function useFeed(id: number) {
  const load = useCallback(() => getFeedById(id), [id]);
  return useAsyncData(load);
}
