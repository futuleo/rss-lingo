import { useCallback, useState } from 'react';
import { setArticleSaved } from '../model/repository';
import type { Article } from '../model/types';

export interface UseToggleSavedResult {
  saving: boolean;
  toggleSaved: (
    article: Article,
    setArticle: (article: Article | null) => void,
    options?: { onError?: (error: Error) => void },
  ) => Promise<void>;
}

/**
 * Optimistically toggles the saved flag on an article and rolls it back
 * if persistence fails.
 */
export function useToggleSaved(): UseToggleSavedResult {
  const [saving, setSaving] = useState(false);

  const toggleSaved = useCallback(
    async (
      article: Article,
      setArticle: (article: Article | null) => void,
      options?: { onError?: (error: Error) => void },
    ) => {
      const next = { ...article, saved: !article.saved };
      setArticle(next);
      setSaving(true);
      try {
        await setArticleSaved(article.id, next.saved);
      } catch (error) {
        setArticle(article);
        options?.onError?.(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { saving, toggleSaved };
}
