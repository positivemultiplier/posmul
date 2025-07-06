export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/__tests__', '<rootDir>/src'],
  transform: {
    '^.+\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
      },
    }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!@posmul/)"
  ],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleNameMapper: {
    '@posmul/shared-types': '<rootDir>/../shared-types/src/index.ts',
    '@posmul/shared-auth': '<rootDir>/../shared-auth/src/index.ts',
  },
};