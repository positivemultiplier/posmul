/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)?$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        // Jest용 독립 설정 (루트 tsconfig 상속 안함)
        module: 'CommonJS',
        target: 'ES2017',
        lib: ['ES2017'],
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
        resolveJsonModule: true,
        isolatedModules: true,
        allowSyntheticDefaultImports: true,
        declaration: false,
        noEmit: true,
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!@posmul/)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/', // Exclude Playwright tests
    '<rootDir>/node_modules/',
    // 실제 DB가 필요한 통합 테스트는 기본 단위 테스트에서 제외 (pnpm test:integration 으로 별도 실행)
    ...(process.env.RUN_INTEGRATION === 'true' ? [] : ['\\.integration\\.test\\.ts$']),
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@posmul/shared-types/(.*)$': '<rootDir>/../../packages/shared-types/src/$1',
    '^@posmul/shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
    '^@posmul/auth-economy-sdk/(.*)$': '<rootDir>/../../packages/auth-economy-sdk/src/$1',
    '^@posmul/auth-economy-sdk$': '<rootDir>/../../packages/auth-economy-sdk/src/index.ts',
    '^@posmul/study-cycle-core$': '<rootDir>/../../packages/study-cycle-core/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
