/// <reference types="jest" />
import { migrateDatabase } from '@shared/lib/db';
import { NodeSqliteAdapter } from '@shared/lib/db/testing/node-sqlite-adapter';
import type * as SQLite from 'expo-sqlite';
import {
  DEFAULT_READER_SETTINGS,
  READER_FONT_SIZE_MAX,
  READER_FONT_SIZE_MIN,
  getReaderSettings,
  normalizeReaderSettings,
  saveReaderSettings,
} from '..';

async function openTestDb(): Promise<SQLite.SQLiteDatabase> {
  const adapter = NodeSqliteAdapter.open();
  await adapter.execAsync('PRAGMA foreign_keys = ON');
  await migrateDatabase(adapter as unknown as SQLite.SQLiteDatabase);
  return adapter as unknown as SQLite.SQLiteDatabase;
}

describe('normalizeReaderSettings', () => {
  test('returns defaults for missing or non-object input', () => {
    expect(normalizeReaderSettings(undefined)).toEqual(DEFAULT_READER_SETTINGS);
    expect(normalizeReaderSettings(null)).toEqual(DEFAULT_READER_SETTINGS);
    expect(normalizeReaderSettings('garbage')).toEqual(DEFAULT_READER_SETTINGS);
    expect(normalizeReaderSettings({})).toEqual(DEFAULT_READER_SETTINGS);
  });

  test('clamps font size into range and rounds fractions', () => {
    expect(normalizeReaderSettings({ fontSize: 9999 }).fontSize).toBe(
      READER_FONT_SIZE_MAX,
    );
    expect(normalizeReaderSettings({ fontSize: -5 }).fontSize).toBe(
      READER_FONT_SIZE_MIN,
    );
    expect(normalizeReaderSettings({ fontSize: 20.6 }).fontSize).toBe(21);
  });

  test('falls back to defaults for unknown enum values', () => {
    const result = normalizeReaderSettings({
      fontId: 'nope',
      lineHeightId: 'nope',
      justify: 'yes',
    });
    expect(result.fontId).toBe(DEFAULT_READER_SETTINGS.fontId);
    expect(result.lineHeightId).toBe(DEFAULT_READER_SETTINGS.lineHeightId);
    expect(result.justify).toBe(DEFAULT_READER_SETTINGS.justify);
  });

  test('preserves valid values', () => {
    const result = normalizeReaderSettings({
      fontId: 'palatino',
      fontSize: 22,
      lineHeightId: 'relaxed',
      justify: true,
    });
    expect(result).toEqual({
      fontId: 'palatino',
      fontSize: 22,
      lineHeightId: 'relaxed',
      justify: true,
    });
  });
});

describe('reader settings repository', () => {
  let db: SQLite.SQLiteDatabase;

  beforeEach(async () => {
    db = await openTestDb();
  });

  test('returns defaults when nothing is stored', async () => {
    expect(await getReaderSettings(db)).toEqual(DEFAULT_READER_SETTINGS);
  });

  test('round-trips settings', async () => {
    const settings = {
      fontId: 'helvetica' as const,
      fontSize: 24,
      lineHeightId: 'relaxed' as const,
      justify: true,
    };
    await saveReaderSettings(settings, db);
    expect(await getReaderSettings(db)).toEqual(settings);
  });

  test('ignores stale themeId from older persisted payloads', async () => {
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'reader-settings',
      '{"fontSize": 999, "themeId": "sepia"}',
    ]);
    const result = await getReaderSettings(db);
    expect(result.fontSize).toBe(READER_FONT_SIZE_MAX);
    expect(result).not.toHaveProperty('themeId');
  });
});
