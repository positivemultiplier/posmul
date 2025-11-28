/** @type {import('next').NextConfig} */
import typescriptEslintParser from "@typescript-eslint/parser";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "dist/**"],
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // 기본 품질 규칙
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],

      // 복잡도 제한
      "complexity": ["warn", { max: 15 }],

      // React 규칙
      "react/jsx-no-comment-textnodes": "off", // 임시로 비활성화
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
    },
    rules: {
      // 기본 품질 규칙
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "off", // TypeScript가 처리
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],

      // 복잡도 제한
      "complexity": ["warn", { max: 15 }],

      // React 규칙
      "react/jsx-no-comment-textnodes": "off", // 임시로 비활성화
    },
  },
  {
    files: ["**/*.test.js", "**/*.test.ts", "**/*.test.jsx", "**/*.test.tsx"],
    rules: {
      // 테스트 파일에서는 더 관대한 규칙 적용
      "no-console": "off",
      "complexity": "off",
    },
  },
];
