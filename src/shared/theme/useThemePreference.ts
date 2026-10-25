import { useContext } from 'react';
import {
  ThemePreferenceContext,
  type ThemePreferenceValue,
} from './ThemeProvider';

export function useThemePreference(): ThemePreferenceValue {
  const value = useContext(ThemePreferenceContext);
  if (!value) {
    throw new Error('useThemePreference must be used inside <ThemeProvider>');
  }
  return value;
}
