/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  coverageDirectory: "<rootDir>/coverage",
  transform: {
    '^.+\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
      },
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.spec.ts', '**/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    "node_modules/(?!@posmul/)"
  ],
};
