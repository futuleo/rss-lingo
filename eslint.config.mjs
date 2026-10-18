// @ts-check
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import prettierConfig from 'eslint-config-prettier/flat';

const forbiddenLayerImports = {
  shared: ['@entities/**', '@features/**', '@widgets/**', '@pages/**', '@app/**'],
  entities: ['@features/**', '@widgets/**', '@pages/**', '@app/**'],
  widgets: ['@pages/**', '@app/**'],
  features: ['@pages/**', '@app/**'],
  pages: ['@app/**'],
};

/**
 * Creates a no-restricted-imports rule that enforces FSD layer boundaries.
 */
function layerRestriction(layer, forbidden) {
  return {
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: forbidden.map((pattern) => ({
            group: [pattern],
            message: `FSD: ${layer} layer may not import ${pattern}.`,
          })),
        },
      ],
    },
  };
}

const deepImportRestriction = {
  files: ['src/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '@entities/*/*',
              '@features/*/*',
              '@widgets/*/*',
              '@pages/*/*',
              '@app/*/*',
            ],
            message:
              'FSD: prefer public index exports; deep imports across slice boundaries are not allowed.',
          },
        ],
      },
    ],
  },
};

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
  layerRestriction('shared', forbiddenLayerImports.shared),
  layerRestriction('entities', forbiddenLayerImports.entities),
  layerRestriction('widgets', forbiddenLayerImports.widgets),
  layerRestriction('features', forbiddenLayerImports.features),
  layerRestriction('pages', forbiddenLayerImports.pages),
  deepImportRestriction,
  {
    ignores: ['node_modules/*', '.expo/*', 'dist/*', 'expo-env.d.ts'],
  },
]);
