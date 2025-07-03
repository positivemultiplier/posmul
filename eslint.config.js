import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
      '.turbo/**',
      '**/*.d.ts',
      'apps/posmul-web/**',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // project removed to disable type-aware parsing for lint speed and avoid missing tsconfig errors
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      'no-undef': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]; 