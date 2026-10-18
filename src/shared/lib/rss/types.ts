/** Normalized representation of one feed entry, independent of RSS/Atom format. */
export interface ParsedArticle {
  /** Stable identity: guid, or link, or a hash fallback. */
  guid: string;
  url: string | null;
  title: string;
  author: string | null;
  summary: string | null;
  /** Raw HTML content, preferred source for the reader view. */
  contentHtml: string | null;
  /** Unix milliseconds, null when the feed provides no parseable date. */
  publishedAt: number | null;
}

export interface ParsedFeed {
  title: string | null;
  siteUrl: string | null;
  articles: ParsedArticle[];
}
