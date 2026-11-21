const js = require('@eslint/js');
const ts = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

// housing-pro 패키지에는 eslint-plugin-react-hooks / @next/eslint-plugin-next가 없으므로
// CI(--frozen-lockfile) 환경에서도 eslint-disable 주석이 오류를 유발하지 않도록 인라인 호환 객체를 제공합니다.
const reactHooksCompatPlugin = {
  rules: {
    'exhaustive-deps': { meta: { type: 'suggestion', schema: [] }, create: () => ({}) },
    'rules-of-hooks': { meta: { type: 'problem', schema: [] }, create: () => ({}) },
  },
};

const nextCompatPlugin = {
  rules: {
    'no-img-element': { meta: { type: 'suggestion', schema: [] }, create: () => ({}) },
  },
};

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
      '.turbo/**',
      'out/**',
      'supabase/**',
      '**/*.d.ts',
      'apps/posmul-web/**',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      // TypeScript 환경에서는 tsc --noEmit이 DOM/Browser/Node 심볼을 정확히 검증하므로 no-undef 비활성화
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Housing-Pro 전용 설정: 기존 레거시 호환(warn) + God File(500줄) 경고
  {
    files: ['apps/housing-pro/**/*.ts', 'apps/housing-pro/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      'react-hooks': reactHooksCompatPlugin,
      '@next/next': nextCompatPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-useless-escape': 'warn',
      'max-lines': [
        'warn',
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  // Housing-Pro Clean Architecture 가드레일: UI 컴포넌트에서 supabaseAdmin 직접 import 차단
  {
    files: [
      'apps/housing-pro/src/components/**/*.ts',
      'apps/housing-pro/src/components/**/*.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/supabase/admin', '**/lib/supabase/admin*'],
              message:
                'Housing-Pro Clean Architecture 위반: UI 컴포넌트는 supabaseAdmin을 직접 import할 수 없습니다. Server Action(src/app/actions/)을 경유하세요.',
            },
          ],
        },
      ],
    },
  },
];
