import { getDb } from '@shared/lib/db';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_KEY = 'theme';

function isThemePreference(value: string): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export async function getThemePreference(): Promise<ThemePreference> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [THEME_KEY],
  );
  if (!row || !isThemePreference(row.value)) {
    return 'system';
  }
  return row.value;
}

export async function saveThemePreference(
  preference: ThemePreference,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [THEME_KEY, preference],
  );
}
