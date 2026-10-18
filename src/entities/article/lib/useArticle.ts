import { useCallback } from 'react';
import { useAsyncData } from '@shared/lib/hooks';
import { getArticle } from '../model/repository';

export function useArticle(id: number) {
  const load = useCallback(() => getArticle(id), [id]);
  return useAsyncData(load);
}
