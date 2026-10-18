// @ts-check
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import prettierConfig from 'eslint-config-prettier/flat';

export default defineConfig([
  expoConfig,
  prettierConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // i18next idiomatic usage relies on calling methods on the default export
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    ignores: ['node_modules/*', '.expo/*', 'dist/*', 'expo-env.d.ts'],
  },
]);
