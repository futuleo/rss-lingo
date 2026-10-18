import { decode as decodeHtmlEntities } from 'he';
import { createProvider } from '@shared/api/ai';
import type { AiProviderSettings } from '@entities/ai-provider';
import type { Article } from '@entities/article';
import { saveTranslation } from '@entities/translation';
import { splitIntoChunks } from './chunking';

export class TranslationError extends Error {
  constructor(
    message: string,
    public readonly cause: unknown,
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

export interface TranslateArticleOptions {
  apiKey: string;
  onProgress?: (progress: { done: number; total: number }) => void;
  signal?: AbortSignal;
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function paragraphsToHtml(text: string): string {
  return text
    .split(/\n\s*\n|\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('\n');
}

/**
 * Translates an article's HTML content using the configured provider.
 *
 * The content is split into block-level chunks, each chunk is translated
 * sequentially, and the resulting plain-text paragraphs are joined into a
 * single HTML string. The final translation is persisted in the cache.
 */
export async function translateArticle(
  article: Article,
  settings: AiProviderSettings,
  options: TranslateArticleOptions,
): Promise<string> {
  const { apiKey, onProgress, signal } = options;

  if (signal?.aborted) {
    throw new TranslationError(
      'Translation cancelled',
      new DOMException('Aborted', 'AbortError'),
    );
  }

  let provider;
  try {
    provider = createProvider(settings.providerId);
  } catch (error) {
    throw new TranslationError('AI provider is not configured correctly', error);
  }

  const chunks = splitIntoChunks(article.contentHtml ?? '', 2000);
  const translatedChunks: string[] = [];

  try {
    for (let i = 0; i < chunks.length; i++) {
      if (signal?.aborted) {
        throw new TranslationError(
          'Translation cancelled',
          new DOMException('Aborted', 'AbortError'),
        );
      }

      const plainChunk = stripHtml(chunks[i]!);
      if (plainChunk.length === 0) {
        translatedChunks.push('');
      } else {
        const translated = await provider.translate({
          text: plainChunk,
          targetLang: settings.targetLang,
          apiKey,
          model: settings.model,
          baseUrl: settings.baseUrl,
          signal,
        });
        translatedChunks.push(translated);
      }

      onProgress?.({ done: i + 1, total: chunks.length });
    }
  } catch (error) {
    if (error instanceof TranslationError) {
      throw error;
    }
    throw new TranslationError(
      error instanceof Error ? error.message : 'Translation failed',
      error,
    );
  }

  if (signal?.aborted) {
    throw new TranslationError(
      'Translation cancelled',
      new DOMException('Aborted', 'AbortError'),
    );
  }

  const translatedHtml = translatedChunks.map(paragraphsToHtml).join('\n');

  if (signal?.aborted) {
    throw new TranslationError(
      'Translation cancelled',
      new DOMException('Aborted', 'AbortError'),
    );
  }

  try {
    await saveTranslation(
      article.id,
      settings.targetLang,
      settings.providerId,
      settings.model,
      translatedHtml,
    );
  } catch (error) {
    throw new TranslationError('Translation failed to save', error);
  }

  return translatedHtml;
}
