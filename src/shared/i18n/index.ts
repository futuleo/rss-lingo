import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import fi from './locales/fi.json';
import ru from './locales/ru.json';

export const supportedLanguages = ['en', 'ru', 'fi'] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  fi: { translation: fi },
} as const;

export function detectLanguage(): AppLanguage {
  const deviceCodes = Localization.getLocales().map((locale) => locale.languageCode);
  for (const code of deviceCodes) {
    if ((supportedLanguages as readonly string[]).includes(code ?? '')) {
      return code as AppLanguage;
    }
  }
  return 'en';
}

export function setAppLanguage(lang: AppLanguage): void {
  if (i18n.language !== lang) {
    void i18n.changeLanguage(lang);
  }
}

export function initI18n(): void {
  if (i18n.isInitialized) {
    return;
  }
  void i18n.use(initReactI18next).init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    supportedLngs: [...supportedLanguages],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
