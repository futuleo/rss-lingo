import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from './migrations';

const DATABASE_NAME = 'rsslingo.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (db) => {
        // Foreign keys are disabled by default in SQLite and must be enabled
        // outside of any transaction for ON DELETE CASCADE to take effect.
        await db.execAsync('PRAGMA foreign_keys = ON');
        const row = await db.getFirstAsync<{ foreign_keys: number }>(
          'PRAGMA foreign_keys',
        );
        if ((row?.foreign_keys ?? 0) !== 1) {
          throw new Error('Failed to enable SQLite foreign keys');
        }
        await migrateDatabase(db);
        return db;
      })
      .catch(async (error) => {
        dbPromise = null;
        throw error;
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
