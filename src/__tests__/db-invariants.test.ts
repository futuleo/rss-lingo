/// <reference types="jest" />
import { createFeed, deleteFeed, getFeedByUrl } from '@entities/feed';
import {
  pruneFeedArticles,
  setArticleContent,
  setArticleSaved,
  upsertArticles,
} from '@entities/article';
import { migrateDatabase } from '@shared/lib/db/migrations';
import { NodeSqliteAdapter } from '@shared/lib/db/testing/node-sqlite-adapter';
import type * as SQLite from 'expo-sqlite';

async function openTestDb(): Promise<SQLite.SQLiteDatabase> {
  const adapter = NodeSqliteAdapter.open();
  await adapter.execAsync('PRAGMA foreign_keys = ON');
  await migrateDatabase(adapter as unknown as SQLite.SQLiteDatabase);
  return adapter as unknown as SQLite.SQLiteDatabase;
}

function makeArticle(guid: string, publishedAt: number) {
  return {
    guid,
    url: `https://example.org/${guid}`,
    title: `Title ${guid}`,
    author: null,
    summary: null,
    contentHtml: null,
    hasFullContent: false,
    publishedAt,
  };
}

describe('database invariants', () => {
  let db: SQLite.SQLiteDatabase;

  beforeEach(async () => {
    db = await openTestDb();
  });

  test('upsert does not clobber saved=1', async () => {
    const feed = await createFeed({ url: 'https://example.org/feed' }, db);
    expect(feed).not.toBeNull();

    await upsertArticles(feed!.id, [makeArticle('a1', 1_000_000)], db);
    const inserted = (await getFeedByUrl(feed!.url, db))!;
    const articles = await db.getAllAsync<{ id: number; saved: number }>(
      'SELECT id, saved FROM articles WHERE feed_id = ?',
      [inserted.id],
    );
    expect(articles).toHaveLength(1);

    await setArticleSaved(articles[0]!.id, true, db);

    await upsertArticles(
      feed!.id,
      [{ ...makeArticle('a1', 1_000_000), title: 'Updated title' }],
      db,
    );

    const row = await db.getFirstAsync<{ saved: number; title: string }>(
      'SELECT saved, title FROM articles WHERE guid = ?',
      ['a1'],
    );
    expect(row).toEqual({ saved: 1, title: 'Updated title' });
  });

  test('fetched full content survives a teaser-only refresh', async () => {
    const feed = await createFeed({ url: 'https://example.org/feed' }, db);
    expect(feed).not.toBeNull();

    // Insert a teaser-only article (no full content).
    await upsertArticles(
      feed!.id,
      [{ ...makeArticle('a1', 1_000_000), contentHtml: '<p>teaser</p>' }],
      db,
    );
    const inserted = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM articles WHERE guid = ?',
      ['a1'],
    );
    expect(inserted).not.toBeNull();

    // Fetch-and-persist full content.
    await setArticleContent(inserted!.id, '<p>full</p>', db);

    // A later refresh still only ships the teaser: full content is preserved.
    await upsertArticles(
      feed!.id,
      [{ ...makeArticle('a1', 1_000_000), contentHtml: '<p>teaser</p>' }],
      db,
    );

    const preserved = await db.getFirstAsync<{
      content_html: string | null;
      has_full_content: number;
    }>('SELECT content_html, has_full_content FROM articles WHERE guid = ?', ['a1']);
    expect(preserved?.content_html).toBe('<p>full</p>');
    expect(preserved?.has_full_content).toBe(1);

    // A fresh incoming article with full content DOES overwrite the row.
    await upsertArticles(
      feed!.id,
      [
        {
          ...makeArticle('a1', 1_000_000),
          contentHtml: '<p>new full</p>',
          hasFullContent: true,
        },
      ],
      db,
    );

    const overwritten = await db.getFirstAsync<{
      content_html: string | null;
      has_full_content: number;
    }>('SELECT content_html, has_full_content FROM articles WHERE guid = ?', ['a1']);
    expect(overwritten?.content_html).toBe('<p>new full</p>');
    expect(overwritten?.has_full_content).toBe(1);
  });

  test('teaser-only content still updates on refresh when never full-fetched', async () => {
    const feed = await createFeed({ url: 'https://example.org/feed' }, db);
    expect(feed).not.toBeNull();

    await upsertArticles(
      feed!.id,
      [{ ...makeArticle('a1', 1_000_000), contentHtml: '<p>old teaser</p>' }],
      db,
    );

    await upsertArticles(
      feed!.id,
      [{ ...makeArticle('a1', 1_000_000), contentHtml: '<p>new teaser</p>' }],
      db,
    );

    const row = await db.getFirstAsync<{
      content_html: string | null;
      has_full_content: number;
    }>('SELECT content_html, has_full_content FROM articles WHERE guid = ?', ['a1']);
    expect(row?.content_html).toBe('<p>new teaser</p>');
    expect(row?.has_full_content).toBe(0);
  });

  test('prune keeps newest 50 non-saved and all saved articles', async () => {
    const feed = await createFeed({ url: 'https://example.org/feed' }, db);
    expect(feed).not.toBeNull();

    const articles = Array.from({ length: 60 }, (_, i) =>
      makeArticle(`a${i}`, 1_000_000 + i),
    );
    await upsertArticles(feed!.id, articles, db);

    // Mark articles 55-59 as saved (they are among the newest).
    const savedIds = [55, 56, 57, 58, 59];
    const allRows = await db.getAllAsync<{ id: number }>(
      'SELECT id FROM articles WHERE feed_id = ? ORDER BY published_at ASC',
      [feed!.id],
    );
    for (const index of savedIds) {
      await setArticleSaved(allRows[index]!.id, true, db);
    }

    await pruneFeedArticles(feed!.id, 50, db);

    const remaining = await db.getAllAsync<{ guid: string; saved: number }>(
      'SELECT guid, saved FROM articles WHERE feed_id = ? ORDER BY published_at ASC',
      [feed!.id],
    );

    // 50 newest non-saved + 5 saved = 55 total.
    expect(remaining).toHaveLength(55);
    expect(remaining.every((r) => r.guid !== 'a0' && r.guid !== 'a4')).toBe(true);
    expect(remaining.filter((r) => r.saved === 1)).toHaveLength(5);
  });

  test('deleteFeed cascades articles when foreign_keys are enabled', async () => {
    const feed = await createFeed({ url: 'https://example.org/feed' }, db);
    expect(feed).not.toBeNull();

    await upsertArticles(
      feed!.id,
      [makeArticle('a1', 1_000_000), makeArticle('a2', 1_000_001)],
      db,
    );

    const before = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM articles',
    );
    expect(before?.count).toBe(2);

    await deleteFeed(feed!.id, db);

    const afterFeed = await getFeedByUrl(feed!.url, db);
    expect(afterFeed).toBeNull();

    const afterArticles = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM articles',
    );
    expect(afterArticles?.count).toBe(0);
  });

  test('migrations are applied up to the latest version', async () => {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(3);
  });

  test('migrations are idempotent', async () => {
    await migrateDatabase(db);

    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(3);

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN (?, ?, ?, ?)",
      ['feeds', 'articles', 'translations', 'settings'],
    );
    expect(tables.map((t) => t.name).sort()).toEqual([
      'articles',
      'feeds',
      'settings',
      'translations',
    ]);
  });
});
