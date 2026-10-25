import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ar from './locales/ar.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fi from './locales/fi.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';

export const supportedLanguages = [
  'en',
  'ar',
  'de',
  'es',
  'fi',
  'fr',
  'hi',
  'it',
  'ja',
  'ko',
  'pt',
  'ru',
  'zh',
] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  de: { translation: de },
  es: { translation: es },
  fi: { translation: fi },
  fr: { translation: fr },
  hi: { translation: hi },
  it: { translation: it },
  ja: { translation: ja },
  ko: { translation: ko },
  pt: { translation: pt },
  ru: { translation: ru },
  zh: { translation: zh },
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
