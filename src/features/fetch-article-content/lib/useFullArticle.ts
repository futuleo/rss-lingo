import { useEffect, useRef, useState } from 'react';
import type { Article } from '@entities/article';
import { setArticleContent } from '@entities/article';
import { fetchArticleFullContent } from '../model/fetch-full-content';

export type FullArticleStatus = 'loading' | 'ready' | 'error';

/**
 * Fetches full article content for articles that only shipped a teaser and
 * keeps it in sync with the persisted row. Returns `'ready'` when there is
 * nothing to fetch (no article, already full, or no URL).
 */
export function useFullArticle(
  article: Article | null,
  setArticle: (article: Article | null) => void,
): FullArticleStatus {
  // Id of the article whose fetch last failed, used to derive `'error'`.
  const [failedId, setFailedId] = useState<number | null>(null);

  // Kept in a ref so the fetch callback can read the freshest article without
  // adding the whole object to the effect dependencies.
  const articleRef = useRef<Article | null>(article);
  useEffect(() => {
    articleRef.current = article;
  }, [article]);

  const articleId = article?.id ?? null;
  const hasFullContent = article?.hasFullContent ?? false;
  const url = article?.url ?? null;

  useEffect(() => {
    const current = articleRef.current;
    if (current === null || current.hasFullContent || current.url === null) {
      return;
    }

    const id = current.id;
    let cancelled = false;

    fetchArticleFullContent(current.url)
      .then(async (html) => {
        if (cancelled) {
          return;
        }
        const latest = articleRef.current;
        if (latest && latest.id === id) {
          await setArticleContent(latest.id, html);
          if (!cancelled) {
            setArticle({ ...latest, contentHtml: html, hasFullContent: true });
            setFailedId(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailedId(id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [articleId, hasFullContent, url, setArticle]);

  if (articleId === null || hasFullContent || url === null) {
    return 'ready';
  }
  if (failedId === articleId) {
    return 'error';
  }
  return 'loading';
}
