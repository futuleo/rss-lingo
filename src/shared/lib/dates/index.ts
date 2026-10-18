import * as Localization from 'expo-localization';

/**
 * Formats a timestamp (Unix ms) using the device locale.
 * Returns an empty string when the timestamp is unknown.
 */
export function formatDate(timestamp: number | null): string {
  if (timestamp === null) return '';
  const locale = Localization.getLocales()[0]?.languageTag ?? 'en';
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString();
  }
}
