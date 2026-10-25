/// <reference types="jest" />
import { createFeed } from '@entities/feed';
import { upsertArticles } from '@entities/article';
import { getTranslation, saveTranslation } from '@entities/translation';
import { splitIntoChunks } from '@features/translate-article';
import { migrateDatabase } from '@shared/lib/db/migrations';
import { NodeSqliteAdapter } from '@shared/lib/db/testing/node-sqlite-adapter';
import type * as SQLite from 'expo-sqlite';

async function openTestDb(): Promise<SQLite.SQLiteDatabase> {
  const adapter = NodeSqliteAdapter.open();
  await adapter.execAsync('PRAGMA foreign_keys = ON');
  await migrateDatabase(adapter as unknown as SQLite.SQLiteDatabase);
  return adapter as unknown as SQLite.SQLiteDatabase;
}

function makeArticle(guid: string) {
  return {
    guid,
    url: `https://example.org/${guid}`,
    title: `Title ${guid}`,
    author: null,
    summary: null,
    contentHtml: `<p>Paragraph ${guid}</p>`,
    hasFullContent: false,
    publishedAt: 1_000_000,
  };
}

async function insertArticle(db: SQLite.SQLiteDatabase): Promise<number> {
  const feed = await createFeed({ url: 'https://example.org/feed' }, db);
  expect(feed).not.toBeNull();
  await upsertArticles(feed!.id, [makeArticle('t1')], db);
  const row = await db.getFirstAsync<{ id: number }>('SELECT id FROM articles LIMIT 1');
  expect(row).not.toBeNull();
  return row!.id;
}

describe('translation invariants', () => {
  let db: SQLite.SQLiteDatabase;

  beforeEach(async () => {
    db = await openTestDb();
  });

  describe('chunking', () => {
    test('splits long HTML into chunks no larger than maxChars', () => {
      const paragraphs = Array.from({ length: 20 }, (_, i) => `<p>paragraph ${i}</p>`);
      const html = paragraphs.join('');
      const chunks = splitIntoChunks(html, 100);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every((chunk) => chunk.length <= 100)).toBe(true);
    });

    test('keeps every paragraph in the output', () => {
      const paragraphs = Array.from({ length: 10 }, (_, i) => `<p>paragraph ${i}</p>`);
      const html = paragraphs.join('');
      const chunks = splitIntoChunks(html, 100);

      const combined = chunks.join('');
      for (let i = 0; i < 10; i++) {
        expect(combined).toContain(`paragraph ${i}`);
      }
    });

    test('keeps an oversized segment as its own chunk', () => {
      const longText = 'x'.repeat(500);
      const html = `<p>${longText}</p><p>short</p>`;
      const chunks = splitIntoChunks(html, 100);

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.some((chunk) => chunk.length > 100)).toBe(true);
      expect(chunks.some((chunk) => chunk.includes('short'))).toBe(true);
    });
  });

  describe('cache repository', () => {
    test('saveTranslation then getTranslation returns the same text', async () => {
      const articleId = await insertArticle(db);
      const text = '<p>Translated content</p>';

      await saveTranslation(articleId, 'en', 'openai', 'gpt-4o-mini', text, db);
      const translation = await getTranslation(
        articleId,
        'en',
        'openai',
        'gpt-4o-mini',
        db,
      );

      expect(translation).not.toBeNull();
      expect(translation!.text).toBe(text);
    });

    test('upsert updates a single row for the same composite key', async () => {
      const articleId = await insertArticle(db);

      await saveTranslation(articleId, 'en', 'openai', 'gpt-4o-mini', 'first', db);
      await saveTranslation(articleId, 'en', 'openai', 'gpt-4o-mini', 'second', db);

      const translation = await getTranslation(
        articleId,
        'en',
        'openai',
        'gpt-4o-mini',
        db,
      );
      const count = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM translations',
      );

      expect(translation).not.toBeNull();
      expect(translation!.text).toBe('second');
      expect(count?.count).toBe(1);
    });
  });
});
