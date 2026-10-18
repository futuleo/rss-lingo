/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite';
import type * as SQLite from 'expo-sqlite';

/**
 * Subset of `expo-sqlite`'s `SQLiteDatabase` that the repositories need.
 * Kept structural so tests can inject a plain Node `DatabaseSync` connection.
 */
interface SQLiteDatabaseLike {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    params?: SQLite.SQLiteBindParams,
  ): Promise<SQLite.SQLiteRunResult>;
  getFirstAsync<T>(
    sql: string,
    params?: SQLite.SQLiteBindParams,
  ): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SQLite.SQLiteBindParams): Promise<T[]>;
  withTransactionAsync<T>(
    action: (txn: SQLite.SQLiteDatabase) => Promise<T>,
  ): Promise<T>;
  withExclusiveTransactionAsync<T>(
    action: (txn: SQLite.SQLiteDatabase) => Promise<T>,
  ): Promise<T>;
}

/**
 * Minimal in-memory adapter around Node 24's built-in `node:sqlite`.
 * Implements the subset of `expo-sqlite`'s `SQLiteDatabase` that the
 * repositories use, so tests can inject a real SQLite connection without
 * loading the native expo-sqlite module.
 */
export class NodeSqliteAdapter implements SQLiteDatabaseLike {
  constructor(private readonly db: DatabaseSync) {}

  static open(path: string = ':memory:'): NodeSqliteAdapter {
    return new NodeSqliteAdapter(new DatabaseSync(path));
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(
    sql: string,
    params?: SQLite.SQLiteBindParams,
  ): Promise<SQLite.SQLiteRunResult> {
    const statement = this.db.prepare(sql);
    if (params === undefined) {
      return statement.run() as unknown as SQLite.SQLiteRunResult;
    }
    if (Array.isArray(params)) {
      return statement.run(...(params as any[])) as unknown as SQLite.SQLiteRunResult;
    }
    return statement.run(params as any) as unknown as SQLite.SQLiteRunResult;
  }

  async getFirstAsync<T>(
    sql: string,
    params?: SQLite.SQLiteBindParams,
  ): Promise<T | null> {
    const statement = this.db.prepare(sql);
    let row: T | undefined;
    if (params === undefined) {
      row = statement.get() as T | undefined;
    } else if (Array.isArray(params)) {
      row = statement.get(...(params as any[])) as T | undefined;
    } else {
      row = statement.get(params as any) as T | undefined;
    }
    return row ?? null;
  }

  async getAllAsync<T>(
    sql: string,
    params?: SQLite.SQLiteBindParams,
  ): Promise<T[]> {
    const statement = this.db.prepare(sql);
    if (params === undefined) {
      return statement.all() as T[];
    }
    if (Array.isArray(params)) {
      return statement.all(...(params as any[])) as T[];
    }
    return statement.all(params as any) as T[];
  }

  async withTransactionAsync<T>(
    action: (txn: SQLite.SQLiteDatabase) => Promise<T>,
  ): Promise<T> {
    return this.runInTransaction('BEGIN', action);
  }

  async withExclusiveTransactionAsync<T>(
    action: (txn: SQLite.SQLiteDatabase) => Promise<T>,
  ): Promise<T> {
    return this.runInTransaction('BEGIN EXCLUSIVE', action);
  }

  private async runInTransaction<T>(
    begin: string,
    action: (txn: SQLite.SQLiteDatabase) => Promise<T>,
  ): Promise<T> {
    await this.execAsync(begin);
    try {
      const result = await action(this as unknown as SQLite.SQLiteDatabase);
      await this.execAsync('COMMIT');
      return result;
    } catch (error) {
      await this.execAsync('ROLLBACK');
      throw error;
    }
  }
}
