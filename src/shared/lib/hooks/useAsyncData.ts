import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAsyncDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  setData: (data: T | null) => void;
}

interface LoadToken {
  cancelled: boolean;
}

/**
 * Loads asynchronous data with a cancelled-flag cleanup.
 *
 * The loader re-runs automatically when the callback identity changes.
 * Calling `reload` starts a fresh load and cancels any in-flight one.
 */
export function useAsyncData<T>(loader: () => Promise<T>): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const tokenRef = useRef<LoadToken>({ cancelled: false });

  const load = useCallback(
    async (token: LoadToken, signalLoading: boolean) => {
      if (signalLoading) {
        setLoading(true);
        setError(null);
      }
      try {
        const result = await loader();
        if (!token.cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!token.cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!token.cancelled) {
          setLoading(false);
        }
      }
    },
    [loader],
  );

  useEffect(() => {
    tokenRef.current.cancelled = true;
    const token: LoadToken = { cancelled: false };
    tokenRef.current = token;

    loader()
      .then((result) => {
        if (token.cancelled) return;
        setData(result);
      })
      .catch((err) => {
        if (token.cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (token.cancelled) return;
        setLoading(false);
      });

    return () => {
      token.cancelled = true;
    };
  }, [loader]);

  const reload = useCallback(async () => {
    tokenRef.current.cancelled = true;
    const token: LoadToken = { cancelled: false };
    tokenRef.current = token;
    await load(token, true);
  }, [load]);

  return { data, loading, error, reload, setData };
}
