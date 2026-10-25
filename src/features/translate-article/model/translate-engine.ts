import { createProvider } from '@shared/api/ai';
import type { AiProviderSettings } from '@entities/ai-provider';
import type { Article } from '@entities/article';
import { saveTranslation } from '@entities/translation';
import { segmentize, type Segment } from './segmentize';

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Wraps a translated text segment in an HTML tag matching its source. */
function wrapTextSegment(
  segment: Extract<Segment, { kind: 'text' }>,
  text: string,
): string {
  const escaped = escapeHtml(text);
  switch (segment.tag) {
    case 'figcaption':
      return `<figcaption>${escaped}</figcaption>`;
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return `<${segment.tag}>${escaped}</${segment.tag}>`;
    case 'blockquote':
      return `<blockquote>${escaped}</blockquote>`;
    default:
      return `<p>${escaped}</p>`;
  }
}

/**
 * Translates an article's HTML content using the configured provider.
 *
 * The content is split into ordered text and media segments. Each text
 * segment is translated sequentially and re-wrapped in a matching tag, while
 * media segments (images, figures, video, …) are preserved verbatim. The
 * final HTML is persisted in the cache.
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

  const segments = segmentize(article.contentHtml ?? '');

  if (segments.length === 0 || !segments.some((segment) => segment.kind === 'text')) {
    throw new TranslationError('No content to translate', null);
  }

  let provider;
  try {
    provider = createProvider(settings.providerId);
  } catch (error) {
    throw new TranslationError('AI provider is not configured correctly', error);
  }

  const translatedHtmlParts: string[] = [];

  try {
    for (let i = 0; i < segments.length; i++) {
      if (signal?.aborted) {
        throw new TranslationError(
          'Translation cancelled',
          new DOMException('Aborted', 'AbortError'),
        );
      }

      const segment = segments[i]!;
      if (segment.kind === 'media') {
        translatedHtmlParts.push(segment.html);
      } else {
        const translated = await provider.translate({
          text: segment.text,
          targetLang: settings.targetLang,
          apiKey,
          model: settings.model,
          baseUrl: settings.baseUrl,
          signal,
        });
        translatedHtmlParts.push(wrapTextSegment(segment, translated));
      }

      onProgress?.({ done: i + 1, total: segments.length });
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

  const translatedHtml = translatedHtmlParts.join('\n');

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
