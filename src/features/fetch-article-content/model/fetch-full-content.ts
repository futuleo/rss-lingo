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
const FETCH_ATTEMPTS = 2;

function isRetryable(error: unknown): boolean {
  if (error instanceof FullContentError) {
    // A timeout is transient; a definitive result (HTTP error, unexpected
    // content type, no readable content) is not worth retrying.
    return /timed out/i.test(error.message);
  }
  // Non-FullContentError (e.g. a failed fetch / network error) is retryable.
  return true;
}

async function fetchOnce(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
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

/**
 * Fetches an article page and extracts its main text as clean HTML.
 * Throws `FullContentError` on non-OK responses, timeouts, or when the page
 * yields no meaningful article content. Transient failures (timeouts, network
 * errors) are retried once.
 */
export async function fetchArticleFullContent(url: string): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      return await fetchOnce(url);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === FETCH_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw lastError;
}
