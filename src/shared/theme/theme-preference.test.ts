/// <reference types="jest" />
import { resolveThemeMode } from './theme-preference';

describe('resolveThemeMode', () => {
  test('resolves explicit preferences', () => {
    expect(resolveThemeMode('light', 'dark')).toBe('light');
    expect(resolveThemeMode('sepia', 'dark')).toBe('sepia');
    expect(resolveThemeMode('dark', 'light')).toBe('dark');
  });

  test('follows the system scheme when preference is system', () => {
    expect(resolveThemeMode('system', 'dark')).toBe('dark');
    expect(resolveThemeMode('system', 'light')).toBe('light');
    expect(resolveThemeMode('system', null)).toBe('light');
    expect(resolveThemeMode('system', undefined)).toBe('light');
  });
});
