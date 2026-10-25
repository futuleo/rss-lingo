import type { SQLiteDatabase } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { getDb } from '@shared/lib/db';
import type { AiProviderSettings } from './types';

const SETTINGS_KEY = 'ai-provider';

type SettingsChangeListener = () => void;

const settingsChangeListeners = new Set<SettingsChangeListener>();

/**
 * Subscribes to AI provider settings changes. Returns an unsubscribe function.
 * `useAiProviderSettings` uses this so every mounted consumer re-reads the
 * settings when they change in another screen (e.g. the target language).
 */
export function subscribeSettingsChange(listener: SettingsChangeListener): () => void {
  settingsChangeListeners.add(listener);
  return () => {
    settingsChangeListeners.delete(listener);
  };
}

function notifySettingsChange(): void {
  for (const listener of settingsChangeListeners) {
    listener();
  }
}

function apiKeyKey(providerId: string): string {
  return `ai-key-${providerId}`;
}

export async function getSettings(
  db?: SQLiteDatabase,
): Promise<AiProviderSettings | null> {
  const database = db ?? (await getDb());
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [SETTINGS_KEY],
  );
  if (!row) {
    return null;
  }
  return JSON.parse(row.value) as AiProviderSettings;
}

export async function saveSettings(
  settings: AiProviderSettings,
  db?: SQLiteDatabase,
): Promise<void> {
  const database = db ?? (await getDb());
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [SETTINGS_KEY, JSON.stringify(settings)],
  );
  notifySettingsChange();
}

export async function saveApiKey(providerId: string, apiKey: string): Promise<void> {
  const key = apiKeyKey(providerId);
  if (apiKey.trim().length === 0) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await SecureStore.setItemAsync(key, apiKey);
}

export async function getApiKey(providerId: string): Promise<string | null> {
  return SecureStore.getItemAsync(apiKeyKey(providerId));
}

export async function deleteApiKey(providerId: string): Promise<void> {
  await SecureStore.deleteItemAsync(apiKeyKey(providerId));
}
