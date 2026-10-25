/// <reference types="jest" />
import { detectLanguage, supportedLanguages } from '@shared/i18n';

describe('app language detection', () => {
  test('detectLanguage returns a supported language code', () => {
    expect((supportedLanguages as readonly string[]).includes(detectLanguage())).toBe(true);
  });
});
