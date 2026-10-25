import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Article } from '@entities/article';
import { getApiKey, useAiProviderSettings } from '@entities/ai-provider';
import { useAsyncData } from '@shared/lib/hooks';
import { getArticleMetaTranslations, getTranslation } from '@entities/translation';
import { translateArticle, TranslationError } from './translate-engine';
import { translateArticleMeta } from './translate-meta';

type TranslationStatus = 'idle' | 'loading' | 'translating' | 'ready' | 'failed';

export interface TranslationProgress {
  done: number;
  total: number;
}

export interface TranslationState {
  status: TranslationStatus | 'blocked';
  text?: string;
  title?: string;
  error?: TranslationError;
  progress?: TranslationProgress;
}

interface PreparedState {
  status: 'idle' | 'ready' | 'blocked';
  text?: string;
  title?: string;
  apiKey?: string | null;
}

export interface UseArticleTranslationResult {
  state: TranslationState;
  translate: () => void;
  cancel: () => void;
}

/**
 * Manages article translation state.
 *
 * On mount it checks the cache and instantly shows a ready state when a
 * matching translation exists. Otherwise it waits for the user to call
 * `translate()`.
 */
export function useArticleTranslation(
  article: Article | null,
): UseArticleTranslationResult {
  const { settings, loading: settingsLoading } = useAiProviderSettings();

  const loadPrepared = useCallback(async (): Promise<PreparedState> => {
    if (!article || !settings) {
      return { status: 'blocked' };
    }
    const apiKey = await getApiKey(settings.providerId);
    if (!apiKey) {
      return { status: 'blocked' };
    }
    const [cached, metas] = await Promise.all([
      getTranslation(
        article.id,
        settings.targetLang,
        settings.providerId,
        settings.model,
      ),
      getArticleMetaTranslations(
        [article.id],
        settings.targetLang,
        settings.providerId,
        settings.model,
      ),
    ]);
    const title = metas[0]?.title;
    if (cached) {
      return { status: 'ready', text: cached.text, title, apiKey };
    }
    return { status: 'idle', title, apiKey };
  }, [article, settings]);

  const { data: prepared, loading: preparedLoading } = useAsyncData(loadPrepared);

  const [status, setStatus] = useState<TranslationStatus | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<TranslationError | null>(null);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resolvedTitle = title ?? prepared?.title;

  const state = useMemo<TranslationState>(() => {
    if (preparedLoading || settingsLoading) {
      return { status: 'loading', title: resolvedTitle };
    }
    if (status === 'translating') {
      return {
        status: 'translating',
        title: resolvedTitle,
        progress: progress ?? { done: 0, total: 0 },
      };
    }
    if (status === 'ready' && text !== null) {
      return { status: 'ready', text, title: resolvedTitle };
    }
    if (status === 'failed' && error) {
      return { status: 'failed', error, title: resolvedTitle };
    }
    if (prepared?.status === 'blocked') {
      return { status: 'blocked', title: resolvedTitle };
    }
    if (prepared?.status === 'ready' && prepared.text !== undefined) {
      return { status: 'ready', text: prepared.text, title: resolvedTitle };
    }
    return { status: 'idle', title: resolvedTitle };
  }, [
    status,
    text,
    error,
    progress,
    prepared,
    preparedLoading,
    settingsLoading,
    resolvedTitle,
  ]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const translate = useCallback(() => {
    const apiKey = prepared?.apiKey;
    if (!article || !settings || !apiKey || prepared?.status === 'blocked') {
      setStatus('failed');
      setError(new TranslationError('AI provider is not configured', null));
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatus('translating');
    setProgress({ done: 0, total: 0 });
    setError(null);

    (async () => {
      if (!prepared?.title && article.title.trim().length > 0) {
        const meta = await translateArticleMeta(article, settings, {
          apiKey,
          signal: controller.signal,
        });
        setTitle(meta.title);
      }
      const translatedText = await translateArticle(article, settings, {
        apiKey,
        onProgress: (p) => {
          if (!controller.signal.aborted) {
            setProgress(p);
          }
        },
        signal: controller.signal,
      });
      setText(translatedText);
      setStatus('ready');
    })()
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
  }, [article, prepared, settings]);

  useEffect(() => cancel, [cancel]);

  return { state, translate, cancel };
}
