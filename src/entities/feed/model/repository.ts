import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '@shared/lib/db';
import type { Feed, NewFeed } from './types';

interface FeedRow {
  id: number;
  url: string;
  title: string | null;
  site_url: string | null;
  created_at: number;
  last_fetched_at: number | null;
}

function mapRow(row: FeedRow): Feed {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    siteUrl: row.site_url,
    createdAt: row.created_at,
    lastFetchedAt: row.last_fetched_at,
  };
}

export async function listFeeds(db?: SQLiteDatabase): Promise<Feed[]> {
  const database = db ?? (await getDb());
  const rows = await database.getAllAsync<FeedRow>(
    'SELECT * FROM feeds ORDER BY created_at ASC',
  );
  return rows.map(mapRow);
}

export async function getFeedById(
  feedId: number,
  db?: SQLiteDatabase,
): Promise<Feed | null> {
  const database = db ?? (await getDb());
  const row = await database.getFirstAsync<FeedRow>(
    'SELECT * FROM feeds WHERE id = ? LIMIT 1',
    [feedId],
  );
  return row ? mapRow(row) : null;
}

export async function getFeedByUrl(
  url: string,
  db?: SQLiteDatabase,
): Promise<Feed | null> {
  const database = db ?? (await getDb());
  const row = await database.getFirstAsync<FeedRow>(
    'SELECT * FROM feeds WHERE url = ? LIMIT 1',
    [url],
  );
  return row ? mapRow(row) : null;
}

export async function createFeed(
  feed: NewFeed,
  db?: SQLiteDatabase,
): Promise<Feed | null> {
  const database = db ?? (await getDb());
  const result = await database.runAsync(
    `INSERT OR IGNORE INTO feeds (url, title, site_url, created_at)
     VALUES (?, ?, ?, ?)`,
    [feed.url, feed.title ?? null, feed.siteUrl ?? null, Date.now()],
  );
  if (result.changes === 0) {
    return null; // Feed already exists (unique url).
  }
  return getFeedByUrl(feed.url, database);
}

export async function updateFeedMetadata(
  feedId: number,
  meta: { title?: string | null; siteUrl?: string | null; lastFetchedAt?: number },
  db?: SQLiteDatabase,
): Promise<void> {
  const database = db ?? (await getDb());
  const current = await database.getFirstAsync<FeedRow>(
    'SELECT * FROM feeds WHERE id = ?',
    [feedId],
  );
  if (!current) return;

  await database.runAsync(
    `UPDATE feeds
     SET title = ?, site_url = ?, last_fetched_at = ?
     WHERE id = ?`,
    [
      meta.title !== undefined ? meta.title : current.title,
      meta.siteUrl !== undefined ? meta.siteUrl : current.site_url,
      meta.lastFetchedAt ?? current.last_fetched_at,
      feedId,
    ],
  );
}

export async function deleteFeed(feedId: number, db?: SQLiteDatabase): Promise<void> {
  const database = db ?? (await getDb());
  await database.runAsync('DELETE FROM feeds WHERE id = ?', [feedId]);
}
