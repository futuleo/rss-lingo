import { useCallback, useEffect } from 'react';
import { useAsyncData } from '@shared/lib/hooks';
import { PROVIDERS } from '@shared/api/ai';
import { detectLanguage } from '@shared/i18n';
import {
  getSettings,
  saveSettings,
  subscribeSettingsChange,
} from '../model/settings-repository';
import type { AiProviderSettings } from '../model/types';

const DEFAULT_SETTINGS: AiProviderSettings = {
  providerId: PROVIDERS[0]!.id,
  model: PROVIDERS[0]!.defaultModelExample,
  targetLang: detectLanguage(),
};

export function useAiProviderSettings() {
  const load = useCallback(async () => {
    const stored = await getSettings();
    return stored ?? DEFAULT_SETTINGS;
  }, []);

  const { data: settings, loading, error, reload } = useAsyncData(load);

  // Re-read settings whenever they change elsewhere (e.g. the target language
  // is changed in Settings) so every mounted consumer stays in sync.
  useEffect(() => subscribeSettingsChange(() => void reload()), [reload]);

  const save = useCallback(
    async (patch: Partial<AiProviderSettings>) => {
      const current = (await getSettings()) ?? DEFAULT_SETTINGS;
      const next: AiProviderSettings = { ...current, ...patch };
      await saveSettings(next);
      await reload();
    },
    [reload],
  );

  return { settings, loading, error, save, reload };
}
