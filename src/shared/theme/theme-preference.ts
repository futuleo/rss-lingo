import { getDb } from '@shared/lib/db';
import type { ThemeMode } from './tokens';

export type ThemePreference = 'system' | ThemeMode;

const THEME_KEY = 'theme';

function isThemePreference(value: string): value is ThemePreference {
  return (
    value === 'system' || value === 'light' || value === 'sepia' || value === 'dark'
  );
}

/**
 * Resolve a preference into the concrete palette, falling back to the device
 * color scheme when the preference is `system`.
 */
export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | null | undefined,
): ThemeMode {
  switch (preference) {
    case 'light':
      return 'light';
    case 'sepia':
      return 'sepia';
    case 'dark':
      return 'dark';
    default:
      return systemScheme === 'dark' ? 'dark' : 'light';
  }
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

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    THEME_KEY,
    preference,
  ]);
}
