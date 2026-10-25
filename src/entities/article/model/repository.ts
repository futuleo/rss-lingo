import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '@shared/lib/db';
import type { Article, IncomingArticle } from './types';

/** Number of non-saved articles kept per feed; older ones are pruned. */
export const ARTICLES_RETENTION_LIMIT = 50;

interface ArticleRow {
  id: number;
  feed_id: number;
  guid: string;
  url: string | null;
  title: string;
  author: string | null;
  summary: string | null;
  content_html: string | null;
  has_full_content: number;
  published_at: number | null;
  saved: number;
  fetched_at: number;
}

function mapRow(row: ArticleRow): Article {
  return {
    id: row.id,
    feedId: row.feed_id,
    guid: row.guid,
    url: row.url,
    title: row.title,
    author: row.author,
    summary: row.summary,
    contentHtml: row.content_html,
    hasFullContent: row.has_full_content === 1,
    publishedAt: row.published_at,
    saved: row.saved === 1,
    fetchedAt: row.fetched_at,
  };
}

/**
 * Inserts new articles and refreshes metadata of existing ones.
 * The user's `saved` flag is never touched by refreshes.
 */
export async function upsertArticles(
  feedId: number,
  incoming: IncomingArticle[],
  db?: SQLiteDatabase,
): Promise<void> {
  const database = db ?? (await getDb());
  const fetchedAt = Date.now();

  await database.withTransactionAsync(async () => {
    for (const article of incoming) {
      await database.runAsync(
        `INSERT INTO articles
           (feed_id, guid, url, title, author, summary, content_html, has_full_content, published_at, saved, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
         ON CONFLICT(feed_id, guid) DO UPDATE SET
           url = excluded.url,
           title = excluded.title,
           author = excluded.author,
           summary = excluded.summary,
           content_html = CASE WHEN excluded.has_full_content = 1 THEN excluded.content_html ELSE articles.content_html END,
           has_full_content = CASE WHEN excluded.has_full_content = 1 THEN 1 ELSE articles.has_full_content END,
           published_at = excluded.published_at,
           fetched_at = excluded.fetched_at`,
        [
          feedId,
          article.guid,
          article.url,
          article.title,
          article.author,
          article.summary,
          article.contentHtml,
          article.hasFullContent ? 1 : 0,
          article.publishedAt,
          fetchedAt,
        ],
      );
    }
  });
}

export async function listArticlesByFeed(
  feedId: number,
  db?: SQLiteDatabase,
): Promise<Article[]> {
  const database = db ?? (await getDb());
  const rows = await database.getAllAsync<ArticleRow>(
    `SELECT * FROM articles
     WHERE feed_id = ?
     ORDER BY COALESCE(published_at, fetched_at) DESC, id DESC`,
    [feedId],
  );
  return rows.map(mapRow);
}

export async function listSavedArticles(db?: SQLiteDatabase): Promise<Article[]> {
  const database = db ?? (await getDb());
  const rows = await database.getAllAsync<ArticleRow>(
    `SELECT * FROM articles
     WHERE saved = 1
     ORDER BY COALESCE(published_at, fetched_at) DESC, id DESC`,
  );
  return rows.map(mapRow);
}

export async function getArticle(
  articleId: number,
  db?: SQLiteDatabase,
): Promise<Article | null> {
  const database = db ?? (await getDb());
  const row = await database.getFirstAsync<ArticleRow>(
    'SELECT * FROM articles WHERE id = ? LIMIT 1',
    [articleId],
  );
  return row ? mapRow(row) : null;
}

export async function setArticleSaved(
  articleId: number,
  saved: boolean,
  db?: SQLiteDatabase,
): Promise<void> {
  const database = db ?? (await getDb());
  await database.runAsync('UPDATE articles SET saved = ? WHERE id = ?', [
    saved ? 1 : 0,
    articleId,
  ]);
}

/**
 * Persists extracted full-content HTML for an article and flags it as full so
 * later refreshes never downgrade it back to a teaser.
 */
export async function setArticleContent(
  articleId: number,
  contentHtml: string,
  db?: SQLiteDatabase,
): Promise<void> {
  const database = db ?? (await getDb());
  await database.runAsync(
    'UPDATE articles SET content_html = ?, has_full_content = 1 WHERE id = ?',
    [contentHtml, articleId],
  );
}

/**
 * Retention: keeps the newest `limit` non-saved articles of the feed
 * and deletes the rest. Saved articles are never pruned.
 */
export async function pruneFeedArticles(
  feedId: number,
  limit: number = ARTICLES_RETENTION_LIMIT,
  db?: SQLiteDatabase,
): Promise<void> {
  const database = db ?? (await getDb());
  await database.runAsync(
    `DELETE FROM articles
     WHERE feed_id = ? AND saved = 0 AND id NOT IN (
       SELECT id FROM articles
       WHERE feed_id = ? AND saved = 0
       ORDER BY COALESCE(published_at, fetched_at) DESC, id DESC
       LIMIT ?
     )`,
    [feedId, feedId, limit],
  );
}
