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
      'modules/**',
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
    // Everything runs in Node (every package and the data
    // scripts). Using the `globals` package here (rather than hand-listing
    // identifiers) means a global we haven't used yet — e.g. `fetch`,
    // `AbortController` — just works instead of needing another manual
    // addition to this file the next time some code reaches for it.
    files: [
      'packages/*/**/*.ts',
      'data/scripts/**/*.mjs',
      'data/seed/**/*.mjs',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
);
