import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Article } from '@entities/article';
import { getApiKey, useAiProviderSettings } from '@entities/ai-provider';
import { getArticleMetaTranslations } from '@entities/translation';
import { useAsyncData } from '@shared/lib/hooks';
import { TranslationError } from './translate-engine';
import { translateArticleMeta, type ArticleMeta } from './translate-meta';

export type ListTranslationStatus =
  | 'loading'
  | 'idle'
  | 'translating'
  | 'ready'
  | 'blocked'
  | 'failed';

export interface ListTranslationState {
  status: ListTranslationStatus;
  /** articleId -> translated { title, summary } */
  items: Record<number, ArticleMeta>;
  progress?: { done: number; total: number };
  error?: TranslationError;
}

export interface UseListTranslationResult {
  state: ListTranslationState;
  translate: () => void;
  cancel: () => void;
  /** Changes when the translation cache key (lang/provider/model) changes. */
  translationKey: string;
}

interface PreparedState {
  status: 'ok' | 'blocked';
  items: Record<number, ArticleMeta>;
  apiKey: string | null;
}

type LocalStatus = 'translating' | 'ready' | 'failed' | null;

/**
 * Manages translating the titles/summaries of a whole list of articles.
 *
 * On mount it bulk-loads any cached meta translations so previously fetched
 * headlines appear instantly. Remaining headlines are translated sequentially
 * when `translate()` is called and merged into the local `items` map.
 */
export function useListTranslation(articles: Article[]): UseListTranslationResult {
  const { settings, loading: settingsLoading } = useAiProviderSettings();

  const translationKey = settings
    ? `${settings.targetLang}|${settings.providerId}|${settings.model}`
    : '';

  const loadPrepared = useCallback(async (): Promise<PreparedState> => {
    if (!settings) {
      return { status: 'blocked', items: {}, apiKey: null };
    }
    const apiKey = await getApiKey(settings.providerId);
    if (!apiKey) {
      return { status: 'blocked', items: {}, apiKey: null };
    }
    const rows = await getArticleMetaTranslations(
      articles.map((article) => article.id),
      settings.targetLang,
      settings.providerId,
      settings.model,
    );
    const items: Record<number, ArticleMeta> = {};
    for (const row of rows) {
      items[row.articleId] = { title: row.title, summary: row.summary };
    }
    return { status: 'ok', items, apiKey };
  }, [articles, settings]);

  const { data: prepared, loading: preparedLoading } = useAsyncData(loadPrepared);

  const [status, setStatus] = useState<LocalStatus>(null);
  const [items, setItems] = useState<Record<number, ArticleMeta>>({});
  const [error, setError] = useState<TranslationError | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset in-memory translations when the target language (or provider/model)
  // changes so stale headlines from the previous language don't linger and
  // block re-translation.
  const [prevTranslationKey, setPrevTranslationKey] = useState(translationKey);
  if (prevTranslationKey !== translationKey) {
    setPrevTranslationKey(translationKey);
    setItems({});
    setStatus(null);
    setError(null);
    setProgress(null);
  }

  const mergedItems = useMemo(
    () => ({ ...(prepared?.items ?? {}), ...items }),
    [prepared, items],
  );

  // Keep a ref to the latest merged items so `translate` never reads a stale
  // closure when it filters out already-translated headlines.
  const itemsRef = useRef<Record<number, ArticleMeta>>({});

  useEffect(() => {
    itemsRef.current = mergedItems;
  }, [mergedItems]);

  const state = useMemo<ListTranslationState>(() => {
    if (preparedLoading || settingsLoading) {
      return { status: 'loading', items: mergedItems };
    }
    if (status === 'translating') {
      return {
        status: 'translating',
        items: mergedItems,
        progress: progress ?? { done: 0, total: 0 },
      };
    }
    if (status === 'failed' && error) {
      return { status: 'failed', items: mergedItems, error };
    }
    if (prepared?.status === 'blocked') {
      return { status: 'blocked', items: mergedItems };
    }
    const missing = articles.filter(
      (article) => article.title.trim().length > 0 && !mergedItems[article.id],
    );
    if (missing.length === 0) {
      return { status: 'ready', items: mergedItems };
    }
    return { status: 'idle', items: mergedItems };
  }, [
    articles,
    error,
    mergedItems,
    prepared,
    preparedLoading,
    progress,
    settingsLoading,
    status,
  ]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const translate = useCallback(() => {
    const apiKey = prepared?.apiKey;
    if (articles.length === 0 || !settings || !apiKey || prepared?.status === 'blocked') {
      setStatus('failed');
      setError(new TranslationError('AI provider is not configured', null));
      return;
    }

    const missing = articles.filter(
      (article) => article.title.trim().length > 0 && !itemsRef.current[article.id],
    );
    if (missing.length === 0) {
      setStatus('ready');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatus('translating');
    setProgress({ done: 0, total: missing.length });
    setError(null);

    (async () => {
      const total = missing.length;
      for (let i = 0; i < missing.length; i++) {
        if (controller.signal.aborted) {
          throw new TranslationError(
            'Translation cancelled',
            new DOMException('Aborted', 'AbortError'),
          );
        }
        const article = missing[i]!;
        const meta = await translateArticleMeta(article, settings, {
          apiKey,
          signal: controller.signal,
        });
        setItems((prev) => ({ ...prev, [article.id]: meta }));
        setProgress({ done: i + 1, total });
      }
    })()
      .then(() => {
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          setStatus(null);
          return;
        }
        const translationError =
          err instanceof TranslationError
            ? err
            : new TranslationError(
                err instanceof Error ? err.message : 'Translation failed',
                err,
              );
        setError(translationError);
        setStatus('failed');
      })
      .finally(() => {
        abortControllerRef.current = null;
      });
  }, [articles, prepared, settings]);

  useEffect(() => cancel, [cancel]);

  return { state, translate, cancel, translationKey };
}
