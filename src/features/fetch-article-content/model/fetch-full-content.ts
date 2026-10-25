import { extractArticleContent } from './extract';

export class FullContentError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'FullContentError';
  }
}

const FETCH_TIMEOUT_MS = 15000;

/**
 * Fetches an article page and extracts its main text as clean HTML.
 * Throws `FullContentError` on non-OK responses, timeouts, or when the page
 * yields no meaningful article content.
 */
export async function fetchArticleFullContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!response.ok) {
      throw new FullContentError(
        `Article request failed: HTTP ${response.status} (${url})`,
      );
    }
    const contentType = response.headers.get('content-type');
    if (
      contentType &&
      !/^(text\/html|application\/xhtml\+xml|text\/xml|application\/xml)/i.test(
        contentType,
      )
    ) {
      throw new FullContentError(
        `Unexpected content type "${contentType}" (${url})`,
      );
    }
    const html = await response.text();
    const content = extractArticleContent(html);
    if (content === null) {
      throw new FullContentError(`No article content found (${url})`);
    }
    return content;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FullContentError(`Article request timed out (${url})`, error);
    }
    if (error instanceof FullContentError) {
      throw error;
    }
    throw new FullContentError(
      error instanceof Error ? error.message : 'Article request failed',
      error,
    );
  } finally {
    clearTimeout(timeout);
  }
}
