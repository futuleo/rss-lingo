import { fetchAndParseFeed } from '@shared/lib/rss';
import { pruneFeedArticles, upsertArticles } from '@entities/article';
import {
  createFeed,
  getFeedByUrl,
  updateFeedMetadata,
  type Feed,
} from '@entities/feed';

export class AddFeedError extends Error {
  constructor(
    message: string,
    readonly feedUrl: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AddFeedError';
  }
}

/**
 * Adds a feed by direct RSS URL. The URL is fetched and parsed BEFORE any
 * database write so that network/parser failures never leave zombie rows.
 */
export async function addFeedByUrl(url: string): Promise<Feed> {
  let parsed;
  try {
    parsed = await fetchAndParseFeed(url);
  } catch (error) {
    throw new AddFeedError(
      error instanceof Error ? error.message : 'Unknown feed error',
      url,
      error,
    );
  }

  const feed = await createFeed({ url });
  if (!feed) {
    throw new AddFeedError('Feed already exists or could not be created', url);
  }

  if (parsed.articles.length > 0) {
    await upsertArticles(feed.id, parsed.articles);
  }
  await pruneFeedArticles(feed.id);

  const now = Date.now();
  await updateFeedMetadata(feed.id, {
    title: parsed.title,
    siteUrl: parsed.siteUrl,
    lastFetchedAt: now,
  });

  return (await getFeedByUrl(url)) ?? feed;
}
