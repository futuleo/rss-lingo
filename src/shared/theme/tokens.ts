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

export const palettes: Record<ColorSchemeName, ThemeColors> = {
  light: {
    background: '#f7f6f3',
    surface: '#ffffff',
    text: '#1b1a18',
    textMuted: '#6e6c67',
    primary: '#0f766e',
    primaryText: '#ffffff',
    border: '#e8e5df',
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
  danger: string;
}
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
