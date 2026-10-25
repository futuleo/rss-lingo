export type ReaderRequestDecision = 'allow' | 'external' | 'block';

function canonicalize(url: string): string | null {
  try {
    return new URL(url).href;
  } catch {
    return null;
  }
}

export function decideReaderRequest(
  requestUrl: string,
  articleUrl: string | null,
): ReaderRequestDecision {
  // The injected document itself (about: pages, or the reader's own
  // http(s) base URL on iOS's initial loadHTMLString(baseURL:) load)
  // must stay in-app.
  if (requestUrl.startsWith('about:')) {
    return 'allow';
  }

  if (articleUrl != null && /^https?:\/\//i.test(articleUrl)) {
    const canonicalArticleUrl = canonicalize(articleUrl);
    if (
      canonicalArticleUrl != null &&
      canonicalize(requestUrl) === canonicalArticleUrl
    ) {
      return 'allow';
    }
  }

  // Genuine http(s) navigations (tapped links) open in the system browser.
  if (/^https?:\/\//i.test(requestUrl)) {
    return 'external';
  }

  // Block every other scheme (file:, intent:, javascript:, data:, custom).
  return 'block';
}
