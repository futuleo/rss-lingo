/**
 * Reading appearance preferences for the article reader
 * (FSD `entities/reader-settings`). Modeled on Apple Books: font, text size,
 * line spacing, and text justification. The reading theme lives in the app
 * theme preference (light / sepia / dark) so it recolors the whole UI.
 */

export type ReaderFontId =
  'system' | 'georgia' | 'palatino' | 'charter' | 'times' | 'helvetica';

export type LineHeightId = 'compact' | 'regular' | 'relaxed';

export interface ReaderSettings {
  fontId: ReaderFontId;
  /** Body font size in CSS px. */
  fontSize: number;
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
  lineHeightId: 'regular',
  justify: false,
};
