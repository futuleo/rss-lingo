import { useEffect } from 'react';
import { getSettings } from '@entities/ai-provider';
import { setAppLanguage, supportedLanguages, type AppLanguage } from '@shared/i18n';

/**
 * Sets the app UI language to the saved translation target language on launch,
 * so the interface always matches the language articles are translated into.
 */
export function AppLanguageSync() {
  useEffect(() => {
    let cancelled = false;
    void getSettings().then((settings) => {
      if (cancelled) return;
      const lang = settings?.targetLang;
      if (lang && (supportedLanguages as readonly string[]).includes(lang)) {
        setAppLanguage(lang as AppLanguage);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
