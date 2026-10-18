import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from './migrations';

const DATABASE_NAME = 'rsslingo.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await migrateDatabase(db);
      return db;
    });
  }
  return dbPromise;
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  return openDatabase();
}

/** Test-only helper: forgets the cached connection. */
export function resetDatabaseClient(): void {
  dbPromise = null;
}
