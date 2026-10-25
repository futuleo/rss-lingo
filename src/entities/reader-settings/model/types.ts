/**
 * Reading appearance preferences for the article reader
 * (FSD `entities/reader-settings`). Modeled on Apple Books: font, text size,
 * reading theme, line spacing, and text justification.
 */

export type ReaderFontId =
  'system' | 'georgia' | 'palatino' | 'charter' | 'times' | 'helvetica';

export type ReaderThemeId = 'auto' | 'light' | 'sepia' | 'dark';

export type LineHeightId = 'compact' | 'regular' | 'relaxed';

export interface ReaderSettings {
  fontId: ReaderFontId;
  /** Body font size in CSS px. */
  fontSize: number;
  themeId: ReaderThemeId;
  lineHeightId: LineHeightId;
  /** Justify body text like a printed book. */
  justify: boolean;
}

export interface ReaderFont {
  id: ReaderFontId;
  /** CSS font-family stack rendered inside the reader WebView. */
  family: string;
  labelKey: string;
}

export interface ReaderTheme {
  id: ReaderThemeId;
  labelKey: string;
}

export interface LineHeightOption {
  id: LineHeightId;
  /** CSS unitless line-height. */
  value: number;
  labelKey: string;
}

export const READER_FONTS: readonly ReaderFont[] = [
  {
    id: 'system',
    family: "-apple-system, system-ui, 'Segoe UI', Roboto, sans-serif",
    labelKey: 'reader.fontSystem',
  },
  {
    id: 'georgia',
    family: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
    labelKey: 'reader.fontGeorgia',
  },
  {
    id: 'palatino',
    family: "Palatino, 'Palatino Linotype', 'Book Antiqua', serif",
    labelKey: 'reader.fontPalatino',
  },
  {
    id: 'charter',
    family: "Charter, 'Bitstream Charter', Georgia, serif",
    labelKey: 'reader.fontCharter',
  },
  {
    id: 'times',
    family: "'Times New Roman', Times, serif",
    labelKey: 'reader.fontTimes',
  },
  {
    id: 'helvetica',
    family: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    labelKey: 'reader.fontHelvetica',
  },
] as const;

export const READER_THEMES: readonly ReaderTheme[] = [
  { id: 'auto', labelKey: 'reader.themeAuto' },
  { id: 'light', labelKey: 'reader.themeLight' },
  { id: 'sepia', labelKey: 'reader.themeSepia' },
  { id: 'dark', labelKey: 'reader.themeDark' },
] as const;

export const LINE_HEIGHT_OPTIONS: readonly LineHeightOption[] = [
  { id: 'compact', value: 1.5, labelKey: 'reader.lineHeightCompact' },
  { id: 'regular', value: 1.7, labelKey: 'reader.lineHeightRegular' },
  { id: 'relaxed', value: 2.0, labelKey: 'reader.lineHeightRelaxed' },
] as const;

export const READER_FONT_SIZE_MIN = 12;
export const READER_FONT_SIZE_MAX = 30;

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontId: 'georgia',
  fontSize: 18,
  themeId: 'auto',
  lineHeightId: 'regular',
  justify: false,
};
