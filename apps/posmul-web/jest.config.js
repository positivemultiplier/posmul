/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)?$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!@posmul/)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/', // Exclude Playwright tests
    '<rootDir>/node_modules/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@posmul/shared-types/(.*)$': '<rootDir>/../../packages/shared-types/src/$1',
    '^@posmul/shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
    '^@posmul/shared-auth$': '<rootDir>/../../packages/shared-auth/src/index.ts',
    '^@posmul/shared-ui$': '<rootDir>/../../packages/shared-ui/src/index.ts',
    '^@posmul/study-cycle-core$': '<rootDir>/../../packages/study-cycle-core/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
