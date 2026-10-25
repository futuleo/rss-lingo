/**
 * Design tokens for the app theme (FSD `shared/theme`).
 * Light and dark palettes share the same shape; `ThemeColors` enforces it.
 */

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
} as const;

export const radii = {
  s: 8,
  m: 12,
  l: 16,
  full: 999,
} as const;

export const font = {
  title: 24,
  headline: 18,
  body: 15,
  caption: 13,
} as const;

export const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  title: 30,
  headline: 24,
  body: 22,
  caption: 18,
} as const;

export const palettes: Record<ThemeMode, ThemeColors> = {
  light: {
    background: '#f7f6f3',
    surface: '#ffffff',
    text: '#1b1a18',
    textMuted: '#6e6c67',
    primary: '#0f766e',
    primaryText: '#ffffff',
    border: '#e8e5df',
    skeleton: '#e4e1da',
    danger: '#dc2626',
  },
  sepia: {
    background: '#f8f1e3',
    surface: '#fdf9ef',
    text: '#5b4636',
    textMuted: '#8a7a68',
    primary: '#0f766e',
    primaryText: '#ffffff',
    border: '#e6dbc6',
    skeleton: '#e8d9bd',
    danger: '#dc2626',
  },
  dark: {
    background: '#12140f',
    surface: '#1b1e19',
    text: '#eef0ea',
    textMuted: '#9aa39b',
    primary: '#4fd1c5',
    primaryText: '#0a1f1b',
    border: '#2a2e28',
    skeleton: '#252921',
    danger: '#f87171',
  },
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  border: string;
  skeleton: string;
  danger: string;
}

/** The resolved palette: which visual theme the app is currently showing. */
export type ThemeMode = 'light' | 'sepia' | 'dark';

/**
 * CSS/system color scheme. `sepia` resolves to `light` because it is a light
 * background; this value drives the status bar and the reader's color-scheme.
 */
export type ColorSchemeName = 'light' | 'dark';

export interface Theme {
  colors: ThemeColors;
  scheme: ColorSchemeName;
  spacing: typeof spacing;
  radii: typeof radii;
  font: typeof font;
  lineHeight: typeof lineHeight;
  weight: typeof weight;
}
