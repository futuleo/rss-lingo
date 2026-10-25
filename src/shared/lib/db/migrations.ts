import type * as SQLite from 'expo-sqlite';

/**
 * Schema version 1 — initial tables.
 * Retention policy: last 50 non-saved articles per feed are kept;
 * articles marked as saved are never deleted.
 */
const MIGRATION_V1 = `
CREATE TABLE IF NOT EXISTS feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  site_url TEXT,
  created_at INTEGER NOT NULL,
  last_fetched_at INTEGER
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  guid TEXT NOT NULL,
  url TEXT,
  title TEXT NOT NULL,
  author TEXT,
  summary TEXT,
  content_html TEXT,
  published_at INTEGER,
  saved INTEGER NOT NULL DEFAULT 0,
  fetched_at INTEGER NOT NULL,
  UNIQUE(feed_id, guid)
);

CREATE INDEX IF NOT EXISTS idx_articles_feed_published
  ON articles (feed_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_saved
  ON articles (saved) WHERE saved = 1;

CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  model TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(article_id, lang, provider_id, model)
);
`;

/**
 * Schema version 2 — generic key/value settings table.
 * Used for AI provider configuration and other per-user preferences.
 */
const MIGRATION_V2 = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

/**
 * Schema version 3 — track whether an article already stores full content
 * (from content:encoded / content) rather than just a teaser. Fetched full
 * content is flagged so refreshes never downgrade it back to a teaser.
 */
const MIGRATION_V3 = `
ALTER TABLE articles ADD COLUMN has_full_content INTEGER NOT NULL DEFAULT 0;
`;

/**
 * Schema version 4 — cache translated article titles and summaries for the
 * article-list screens. Keyed by the same (article, lang, provider, model)
 * composite as full-article translations so each headline is fetched once.
 */
const MIGRATION_V4 = `
CREATE TABLE IF NOT EXISTS article_meta_translations (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  model TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (article_id, lang, provider_id, model)
);
`;

type Migration = {
  version: number;
  sql: string;
};

const migrations: Migration[] = [
  { version: 1, sql: MIGRATION_V1 },
  { version: 2, sql: MIGRATION_V2 },
  { version: 3, sql: MIGRATION_V3 },
  { version: 4, sql: MIGRATION_V4 },
];

export async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(migration.sql);
      await txn.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    currentVersion = migration.version;
  }
}
