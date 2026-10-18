import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Article } from '@entities/article';
import { getApiKey, useAiProviderSettings } from '@entities/ai-provider';
import { useAsyncData } from '@shared/lib/hooks';
import { getTranslation } from '@entities/translation';
import { translateArticle, TranslationError } from './translate-engine';

type TranslationStatus = 'idle' | 'translating' | 'ready' | 'failed';

export interface TranslationProgress {
  done: number;
  total: number;
}

export interface TranslationState {
  status: TranslationStatus | 'blocked';
  text?: string;
  error?: TranslationError;
  progress?: TranslationProgress;
}

interface PreparedState {
  status: 'idle' | 'ready' | 'blocked';
  text?: string;
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
    const cached = await getTranslation(
      article.id,
      settings.targetLang,
      settings.providerId,
      settings.model,
    );
    if (cached) {
      return { status: 'ready', text: cached.text, apiKey };
    }
    return { status: 'idle', apiKey };
  }, [article, settings]);

  const { data: prepared, loading: preparedLoading } = useAsyncData(loadPrepared);

  const [status, setStatus] = useState<TranslationStatus | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<TranslationError | null>(null);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const state = useMemo<TranslationState>(() => {
    if (preparedLoading || settingsLoading) {
      return { status: 'idle' };
    }
    if (status === 'translating') {
      return { status: 'translating', progress: progress ?? { done: 0, total: 0 } };
    }
    if (status === 'ready' && text !== null) {
      return { status: 'ready', text };
    }
    if (status === 'failed' && error) {
      return { status: 'failed', error };
    }
    if (prepared?.status === 'blocked') {
      return { status: 'blocked' };
    }
    if (prepared?.status === 'ready' && prepared.text !== undefined) {
      return { status: 'ready', text: prepared.text };
    }
    return { status: 'idle' };
  }, [status, text, error, progress, prepared, preparedLoading, settingsLoading]);

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

    translateArticle(article, settings, {
      apiKey,
      onProgress: (p) => {
        if (!controller.signal.aborted) {
          setProgress(p);
        }
      },
      signal: controller.signal,
    })
      .then((translatedText) => {
        setText(translatedText);
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
  }, [article, prepared, settings]);

  useEffect(() => cancel, [cancel]);

  return { state, translate, cancel };
}
