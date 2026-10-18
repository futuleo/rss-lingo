// @ts-check
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat';
import prettierConfig from 'eslint-config-prettier/flat';

export default defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['node_modules/*', '.expo/*', 'dist/*', 'expo-env.d.ts'],
  },
]);
