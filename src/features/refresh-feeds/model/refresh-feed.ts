import { fetchAndParseFeed } from '@shared/lib/rss';
import { pruneFeedArticles, upsertArticles } from '@entities/article';
import { getFeedByUrl, listFeeds, updateFeedMetadata, type Feed } from '@entities/feed';

export class FeedRefreshError extends Error {
  constructor(
    message: string,
    readonly feedId: number | null,
    readonly feedUrl: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'FeedRefreshError';
  }
}

export interface RefreshResult {
  feed: Feed;
  articleCount: number;
}

/**
 * Fetches one feed, persists new/updated articles and applies retention
 * (last 50 non-saved articles are kept, saved ones are never deleted).
 * Feed metadata is updated only after articles are persisted so a broken
 * refresh does not leave stale last_fetched_at / title values behind.
 */
export async function refreshFeed(feed: Feed): Promise<RefreshResult> {
  let parsed;
  try {
    parsed = await fetchAndParseFeed(feed.url);
  } catch (error) {
    throw new FeedRefreshError(
      error instanceof Error ? error.message : 'Unknown feed error',
      feed.id,
      feed.url,
      error,
    );
  }

  const feedId = feed.id;
  if (parsed.articles.length > 0) {
    await upsertArticles(feedId, parsed.articles);
  }
  await pruneFeedArticles(feedId);

  const now = Date.now();
  await updateFeedMetadata(feedId, {
    title: parsed.title ?? feed.title,
    siteUrl: parsed.siteUrl ?? feed.siteUrl,
    lastFetchedAt: now,
  });

  const fresh = await getFeedByUrl(feed.url);
  if (!fresh) {
    throw new FeedRefreshError('Feed disappeared during refresh', feedId, feed.url);
  }
  return { feed: fresh, articleCount: parsed.articles.length };
}

export interface RefreshAllResult {
  refreshed: RefreshResult[];
  failed: FeedRefreshError[];
}

/** Refreshes every feed sequentially; one broken feed does not stop the rest. */
export async function refreshAllFeeds(feeds?: Feed[]): Promise<RefreshAllResult> {
  const all = feeds ?? (await listFeeds());
  const refreshed: RefreshResult[] = [];
  const failed: FeedRefreshError[] = [];

  for (const feed of all) {
    try {
      refreshed.push(await refreshFeed(feed));
    } catch (error) {
      if (error instanceof FeedRefreshError) {
        failed.push(error);
      } else {
        failed.push(
          new FeedRefreshError(
            error instanceof Error ? error.message : 'Unknown error',
            feed.id,
            feed.url,
            error,
          ),
        );
      }
    }
  }

  return { refreshed, failed };
}
