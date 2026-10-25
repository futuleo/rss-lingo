/// <reference types="jest" />
import { createFeed } from '@entities/feed';
import { upsertArticles } from '@entities/article';
import {
  getArticleMetaTranslations,
  saveArticleMetaTranslation,
} from '@entities/translation';
import { migrateDatabase } from '@shared/lib/db/migrations';
import { NodeSqliteAdapter } from '@shared/lib/db/testing/node-sqlite-adapter';
import type * as SQLite from 'expo-sqlite';

async function openTestDb(): Promise<SQLite.SQLiteDatabase> {
  const adapter = NodeSqliteAdapter.open();
  await adapter.execAsync('PRAGMA foreign_keys = ON');
  await migrateDatabase(adapter as unknown as SQLite.SQLiteDatabase);
  return adapter as unknown as SQLite.SQLiteDatabase;
}

function makeArticle(guid: string, summary: string | null) {
  return {
    guid,
    url: `https://example.org/${guid}`,
    title: `Title ${guid}`,
    author: null,
    summary,
    contentHtml: `<p>Paragraph ${guid}</p>`,
    hasFullContent: false,
    publishedAt: 1_000_000,
  };
}

/** Inserts two articles under one feed and returns their ids in order. */
async function insertArticles(db: SQLite.SQLiteDatabase): Promise<[number, number]> {
  const feed = await createFeed({ url: 'https://example.org/feed' }, db);
  expect(feed).not.toBeNull();
  await upsertArticles(
    feed!.id,
    [
      makeArticle('m1', 'Summary m1'),
      makeArticle('m2', 'Summary m2'),
    ],
    db,
  );
  const rows = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM articles ORDER BY id ASC',
  );
  expect(rows).toHaveLength(2);
  return [rows[0]!.id, rows[1]!.id];
}

describe('article meta translation cache', () => {
  let db: SQLite.SQLiteDatabase;

  beforeEach(async () => {
    db = await openTestDb();
  });

  test('saveArticleMetaTranslation then getArticleMetaTranslations round-trips', async () => {
    const [firstId, secondId] = await insertArticles(db);

    await saveArticleMetaTranslation(
      firstId,
      'en',
      'openai',
      'gpt-4o-mini',
      'Translated title one',
      'Translated summary one',
      db,
    );
    await saveArticleMetaTranslation(
      secondId,
      'en',
      'openai',
      'gpt-4o-mini',
      'Translated title two',
      null,
      db,
    );

    const rows = await getArticleMetaTranslations(
      [firstId, secondId],
      'en',
      'openai',
      'gpt-4o-mini',
      db,
    );

    expect(rows).toHaveLength(2);
    const byId = new Map(rows.map((row) => [row.articleId, row]));
    expect(byId.get(firstId)?.title).toBe('Translated title one');
    expect(byId.get(firstId)?.summary).toBe('Translated summary one');
    expect(byId.get(secondId)?.title).toBe('Translated title two');
    expect(byId.get(secondId)?.summary).toBeNull();
  });

  test('getArticleMetaTranslations returns [] for an empty id list', async () => {
    const rows = await getArticleMetaTranslations([], 'en', 'openai', 'gpt-4o-mini', db);
    expect(rows).toEqual([]);
  });

  test('upsert replaces title and summary for the same composite key', async () => {
    const [firstId] = await insertArticles(db);

    await saveArticleMetaTranslation(
      firstId,
      'en',
      'openai',
      'gpt-4o-mini',
      'First title',
      'First summary',
      db,
    );
    await saveArticleMetaTranslation(
      firstId,
      'en',
      'openai',
      'gpt-4o-mini',
      'Second title',
      'Second summary',
      db,
    );

    const rows = await getArticleMetaTranslations(
      [firstId],
      'en',
      'openai',
      'gpt-4o-mini',
      db,
    );
    const count = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM article_meta_translations',
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]!.title).toBe('Second title');
    expect(rows[0]!.summary).toBe('Second summary');
    expect(count?.count).toBe(1);
  });
});
