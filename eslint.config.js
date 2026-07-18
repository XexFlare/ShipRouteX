// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
      'extracted/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // apps/web runs in the browser.
    files: ['apps/web/**/*.ts'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Everything else runs in Node (the API, every package, and the data
    // scripts). Using the `globals` package here (rather than hand-listing
    // identifiers) means a global we haven't used yet — e.g. `fetch`,
    // `AbortController` — just works instead of needing another manual
    // addition to this file the next time some code reaches for it.
    files: [
      'apps/api/**/*.ts',
      'apps/api/**/*.mts',
      'apps/api/**/*.mjs',
      'packages/*/**/*.ts',
      'data/scripts/**/*.mjs',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
);
