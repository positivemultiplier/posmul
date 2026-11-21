import typescriptEslintParser from "@typescript-eslint/parser";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "tests/**",
      "src/**/__tests__/**",
      "src/**/__snapshots__/**",
      "src/**/*.js",
      "src/**/*.jsx",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      complexity: ["warn", { max: 15 }],
    },
  },
  // Clean Architecture 기계적 가드레일 1: Domain 계층은 외부 인프라/Supabase/Next/React 금지
  {
    files: ["src/bounded-contexts/*/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@supabase/*",
                "@/lib/supabase/*",
                "**/infrastructure/**",
                "**/presentation/**",
                "next/*",
                "react",
                "react-*",
                "**/shared/mcp*",
              ],
              message:
                "Clean Architecture 위반: Domain 계층은 외부 인프라/Supabase/Presentation을 import할 수 없습니다.",
            },
          ],
        },
      ],
    },
  },
  // Clean Architecture 기계적 가드레일 2: Shared 계층에서 Bounded Context 역참조 금지
  {
    files: ["src/shared/**/*.ts", "src/shared/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/bounded-contexts/**", "**/bounded-contexts/**"],
              message:
                "Clean Architecture 위반: shared/ 계층은 bounded-contexts/를 역참조할 수 없습니다.",
            },
          ],
        },
      ],
    },
  },
  // Clean Architecture 기계적 가드레일 3: Application 계층의 Infrastructure/supabaseAdmin 직접 의존 경고
  {
    files: ["src/bounded-contexts/*/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["**/infrastructure/**", "@/lib/supabase/admin"],
              message:
                "Clean Architecture(DIP) 권장 위반: Application 계층은 Infrastructure 구체 구현체나 supabaseAdmin 대신 Domain Port 인터페이스를 주입받으세요.",
            },
          ],
        },
      ],
    },
  },
  // God File 방지 가드레일: 단일 파일 500줄 초과 경고
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "max-lines": [
        "warn",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
    },
  },
];
