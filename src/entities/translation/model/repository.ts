import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '@shared/lib/db';
import type { Translation } from './types';

interface TranslationRow {
  id: number;
  article_id: number;
  lang: string;
  provider_id: string;
  model: string;
  text: string;
  created_at: number;
}

function mapRow(row: TranslationRow): Translation {
  return {
    id: row.id,
    articleId: row.article_id,
    lang: row.lang,
    providerId: row.provider_id,
    model: row.model,
    text: row.text,
    createdAt: row.created_at,
  };
}

export async function getTranslation(
  articleId: number,
  lang: string,
  providerId: string,
  model: string,
  db?: SQLiteDatabase,
): Promise<Translation | null> {
  const database = db ?? (await getDb());
  const row = await database.getFirstAsync<TranslationRow>(
    `SELECT *
     FROM translations
     WHERE article_id = ? AND lang = ? AND provider_id = ? AND model = ?
     LIMIT 1`,
    [articleId, lang, providerId, model],
  );
  return row ? mapRow(row) : null;
}

export async function saveTranslation(
  articleId: number,
  lang: string,
  providerId: string,
  model: string,
  text: string,
  db?: SQLiteDatabase,
): Promise<void> {
  const database = db ?? (await getDb());
  const createdAt = Date.now();
  await database.runAsync(
    `INSERT INTO translations
       (article_id, lang, provider_id, model, text, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(article_id, lang, provider_id, model) DO UPDATE SET
       text = excluded.text,
       created_at = excluded.created_at`,
    [articleId, lang, providerId, model, text, createdAt],
  );
}
