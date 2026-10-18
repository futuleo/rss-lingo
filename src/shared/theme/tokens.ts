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

export const palettes: Record<ColorSchemeName, ThemeColors> = {
  light: {
    background: '#f6f7fb',
    surface: '#ffffff',
    text: '#111418',
    textMuted: '#5d6570',
    primary: '#3b5bdb',
    primaryText: '#ffffff',
    border: '#dfe3ea',
    danger: '#e03131',
  },
  dark: {
    background: '#101318',
    surface: '#1a1f27',
    text: '#f1f3f5',
    textMuted: '#9aa3af',
    primary: '#748ffc',
    primaryText: '#0b0e13',
    border: '#2c333d',
    danger: '#ff6b6b',
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
  danger: string;
}
export type ColorSchemeName = 'light' | 'dark';

export interface Theme {
  colors: ThemeColors;
  scheme: ColorSchemeName;
  spacing: typeof spacing;
  radii: typeof radii;
  font: typeof font;
  weight: typeof weight;
}
