import { dirname } from 'path';
import { fileURLToPath } from 'url';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import-x';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    files: [`${__dirname}/src/**/*.{ts,tsx}`],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: `${__dirname}/tsconfig.app.json`,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'import-x': importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
        },
      ],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.js', '*.mjs', 'vite.config.ts'],
  },
];
