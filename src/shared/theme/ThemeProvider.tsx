import { useColorScheme } from 'react-native';
import type { PropsWithChildren } from 'react';
import { createContext, useMemo } from 'react';
import {
  font,
  palettes,
  radii,
  spacing,
  weight,
  type ColorSchemeName,
  type Theme,
} from './tokens';

export const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const value = useMemo<Theme>(() => {
    const resolved: ColorSchemeName = scheme === 'dark' ? 'dark' : 'light';
    return {
      colors: palettes[resolved],
      scheme: resolved,
      spacing,
      radii,
      font,
      weight,
    };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
