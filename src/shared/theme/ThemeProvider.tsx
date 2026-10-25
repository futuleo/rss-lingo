import { useColorScheme } from 'react-native';
import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  font,
  lineHeight,
  palettes,
  radii,
  spacing,
  weight,
  type Theme,
} from './tokens';
import {
  getThemePreference,
  resolveThemeMode,
  saveThemePreference,
  type ThemePreference,
} from './theme-preference';

export const ThemeContext = createContext<Theme | null>(null);

export interface ThemePreferenceValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemePreferenceContext = createContext<ThemePreferenceValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let cancelled = false;
    void getThemePreference().then((stored) => {
      if (!cancelled) {
        setPreferenceState(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedMode = resolveThemeMode(preference, systemScheme);

  const value = useMemo<Theme>(
    () => ({
      colors: palettes[resolvedMode],
      scheme: resolvedMode === 'dark' ? 'dark' : 'light',
      spacing,
      radii,
      font,
      lineHeight,
      weight,
    }),
    [resolvedMode],
  );

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void saveThemePreference(next);
  }, []);

  return (
    <ThemeContext.Provider value={value}>
      <ThemePreferenceContext.Provider value={{ preference, setPreference }}>
        {children}
      </ThemePreferenceContext.Provider>
    </ThemeContext.Provider>
  );
}
