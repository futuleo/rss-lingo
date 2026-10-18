import { useCallback, useState } from 'react';
import { addFeedByUrl } from './add-feed';

export interface UseAddFeedResult {
  adding: boolean;
  error: Error | null;
  addFeed: (url: string) => Promise<void>;
  resetError: () => void;
}

export function useAddFeed(): UseAddFeedResult {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addFeed = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setAdding(true);
    setError(null);
    try {
      await addFeedByUrl(trimmed);
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error(String(err));
      setError(normalized);
      throw normalized;
    } finally {
      setAdding(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return { adding, error, addFeed, resetError };
}
