import { useEffect, useState } from 'react';
import { getApiKey, useAiProviderSettings } from '@entities/ai-provider';
import { createProvider } from '@shared/api/ai';

/**
 * Translates a feed title (the source name shown on a feed's article list)
 * when translation view is enabled, so the header matches the translated
 * headlines below it. Not cached — the title is a single short string and is
 * re-translated on each entry into translation view.
 */
export function useFeedTitleTranslation(
  feedTitle: string | null | undefined,
  enabled: boolean,
): string | null {
  const { settings } = useAiProviderSettings();
  const [translated, setTranslated] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !feedTitle || !settings) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const apiKey = await getApiKey(settings.providerId);
        if (!apiKey || cancelled) return;
        const provider = createProvider(settings.providerId);
        const result = await provider.translate({
          text: feedTitle,
          targetLang: settings.targetLang,
          apiKey,
          model: settings.model,
          baseUrl: settings.baseUrl,
        });
        if (!cancelled) {
          setTranslated(result);
        }
      } catch {
        if (!cancelled) {
          setTranslated(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, feedTitle, settings]);

  return enabled ? translated : null;
}
