import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/**
 * Root ESLint flat-config.
 * 적용 범위: 모든 .ts / .tsx 파일 (apps, packages 포함)
 */
export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "coverage/**",
      ".turbo/**",
      "**/*.d.ts",
      "apps/posmul-web/**",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        // Disabled project to avoid type-aware requirement
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      // 잠재적 런타임 오류 예방용 추가 규칙 예시
      'no-undef': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]; 