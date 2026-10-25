import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '@shared/lib/db';
import {
  DEFAULT_READER_SETTINGS,
  LINE_HEIGHT_OPTIONS,
  READER_FONT_SIZE_MAX,
  READER_FONT_SIZE_MIN,
  READER_FONTS,
  type LineHeightId,
  type ReaderFontId,
  type ReaderSettings,
} from './types';

const SETTINGS_KEY = 'reader-settings';

function isReaderFontId(value: unknown): value is ReaderFontId {
  return READER_FONTS.some((font) => font.id === value);
}

function isLineHeightId(value: unknown): value is LineHeightId {
  return LINE_HEIGHT_OPTIONS.some((option) => option.id === value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Coerce arbitrary persisted JSON into a valid `ReaderSettings`. Unknown or
 * malformed values fall back to defaults so an old or corrupted row can never
 * crash the reader.
 */
export function normalizeReaderSettings(value: unknown): ReaderSettings {
  const input =
    value != null && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};

  const fontSize =
    typeof input.fontSize === 'number' && Number.isFinite(input.fontSize)
      ? Math.round(input.fontSize)
      : DEFAULT_READER_SETTINGS.fontSize;

  return {
    fontId: isReaderFontId(input.fontId)
      ? input.fontId
      : DEFAULT_READER_SETTINGS.fontId,
    fontSize: clamp(fontSize, READER_FONT_SIZE_MIN, READER_FONT_SIZE_MAX),
    lineHeightId: isLineHeightId(input.lineHeightId)
      ? input.lineHeightId
      : DEFAULT_READER_SETTINGS.lineHeightId,
    justify:
      typeof input.justify === 'boolean'
        ? input.justify
        : DEFAULT_READER_SETTINGS.justify,
  };
}

export async function getReaderSettings(db?: SQLiteDatabase): Promise<ReaderSettings> {
  const database = db ?? (await getDb());
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [SETTINGS_KEY],
  );
  if (!row) {
    return { ...DEFAULT_READER_SETTINGS };
  }
  try {
    return normalizeReaderSettings(JSON.parse(row.value));
  } catch {
    return { ...DEFAULT_READER_SETTINGS };
  }
}

export async function saveReaderSettings(
  settings: ReaderSettings,
  db?: SQLiteDatabase,
): Promise<void> {
  const database = db ?? (await getDb());
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [SETTINGS_KEY, JSON.stringify(normalizeReaderSettings(settings))],
  );
}
