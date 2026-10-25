export interface Article {
  id: number;
  feedId: number;
  guid: string;
  url: string | null;
  title: string;
  author: string | null;
  summary: string | null;
  contentHtml: string | null;
  hasFullContent: boolean;
  publishedAt: number | null;
  saved: boolean;
  fetchedAt: number;
}

/** Payload coming from the RSS parser before it is persisted. */
export interface IncomingArticle {
  guid: string;
  url: string | null;
  title: string;
  author: string | null;
  summary: string | null;
  contentHtml: string | null;
  hasFullContent: boolean;
  publishedAt: number | null;
}
