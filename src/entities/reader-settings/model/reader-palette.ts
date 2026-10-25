import type { Theme } from '@shared/theme';
import type { ReaderSettings, ReaderThemeId } from './types';

/**
 * Content colors used to render an article. Unlike the app theme, these are
 * the reading-surface colors (Apple Books style), independent of the UI
 * chrome.
 */
export interface ReaderPalette {
  background: string;
  text: string;
  textMuted: string;
  /** CSS color-scheme for the reader document. */
  scheme: 'light' | 'dark';
}

const EXPLICIT_PALETTES: Record<Exclude<ReaderThemeId, 'auto'>, ReaderPalette> = {
  light: {
    background: '#ffffff',
    text: '#1b1a18',
    textMuted: '#6e6c67',
    scheme: 'light',
  },
  sepia: {
    background: '#f8f1e3',
    text: '#5b4636',
    textMuted: '#8a7a68',
    scheme: 'light',
  },
  dark: {
    background: '#121212',
    text: '#e6e6e6',
    textMuted: '#9a9a9a',
    scheme: 'dark',
  },
};

/**
 * Resolve the reader's content palette. The `auto` theme follows the app
 * theme, so the reading surface looks native whether the app is light or
 * dark.
 */
export function resolveReaderPalette(
  settings: ReaderSettings,
  appTheme: Theme,
): ReaderPalette {
  if (settings.themeId === 'auto') {
    return {
      background: appTheme.colors.background,
      text: appTheme.colors.text,
      textMuted: appTheme.colors.textMuted,
      scheme: appTheme.scheme,
    };
  }
  return EXPLICIT_PALETTES[settings.themeId];
}

/** Representative background color for a theme swatch in the settings sheet. */
export function readerThemeSwatch(themeId: ReaderThemeId, appTheme: Theme): string {
  if (themeId === 'auto') {
    return appTheme.colors.background;
  }
  return EXPLICIT_PALETTES[themeId].background;
}
