import { createProvider } from '@shared/api/ai';
import type { AiProviderSettings } from '@entities/ai-provider';
import type { Article } from '@entities/article';
import { saveArticleMetaTranslation } from '@entities/translation';
import { TranslationError } from './translate-engine';

export interface ArticleMeta {
  title: string;
  summary: string | null;
}

export interface TranslateArticleMetaOptions {
  apiKey: string;
  signal?: AbortSignal;
}

/**
 * Translates an article's title and summary (the "meta" shown on list cards)
 * and caches the result in the article-meta translations table.
 *
 * Unlike full-article translation, this never splits content into segments —
 * the title and summary are each sent as a single text to the provider.
 */
export async function translateArticleMeta(
  article: Article,
  settings: AiProviderSettings,
  options: TranslateArticleMetaOptions,
): Promise<ArticleMeta> {
  const { apiKey, signal } = options;

  if (signal?.aborted) {
    throw new TranslationError(
      'Translation cancelled',
      new DOMException('Aborted', 'AbortError'),
    );
  }

  if (article.title.trim().length === 0) {
    throw new TranslationError('No content to translate', null);
  }

  let provider;
  try {
    provider = createProvider(settings.providerId);
  } catch (error) {
    throw new TranslationError('AI provider is not configured correctly', error);
  }

  try {
    const title = await provider.translate({
      text: article.title,
      targetLang: settings.targetLang,
      apiKey,
      model: settings.model,
      baseUrl: settings.baseUrl,
      signal,
    });

    let summary: string | null = null;
    if (article.summary && article.summary.trim().length > 0) {
      summary = await provider.translate({
        text: article.summary,
        targetLang: settings.targetLang,
        apiKey,
        model: settings.model,
        baseUrl: settings.baseUrl,
        signal,
      });
    }

    try {
      await saveArticleMetaTranslation(
        article.id,
        settings.targetLang,
        settings.providerId,
        settings.model,
        title,
        summary,
      );
    } catch (error) {
      throw new TranslationError('Translation failed to save', error);
    }

    return { title, summary };
  } catch (error) {
    if (error instanceof TranslationError) {
      throw error;
    }
    throw new TranslationError(
      error instanceof Error ? error.message : 'Translation failed',
      error,
    );
  }
}
