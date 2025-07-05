import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  // 테스트 디렉토리를 현재 앱으로 제한
  testDir: path.join(__dirname, "tests"),
  
  // GitHub Actions에서 병렬 실행
  fullyParallel: true,
  
  // CI 환경에서 실패 시 재시도
  retries: process.env.CI ? 2 : 0,
  
  // CI 환경에서 worker 수 조정
  workers: process.env.CI ? 1 : undefined,
  
  // 테스트 결과 리포터 설정
  reporter: process.env.CI 
    ? [["github"], ["html", { outputFolder: "playwright-report" }]]
    : [["list"], ["html", { outputFolder: "playwright-report" }]],
  
  // 전역 설정 및 정리 (일시적으로 비활성화)
  // globalSetup: require.resolve("./tests/setup/global-setup.ts"),
  // globalTeardown: require.resolve("./tests/setup/global-teardown.ts"),
  
  // Jest와 충돌 방지를 위한 전역 설정
  use: {
    // 기본 URL 설정
    baseURL: "http://localhost:3000",
    
    // 스크린샷 및 비디오 설정
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    
    // 트레이스 수집 (디버깅용)
    trace: "on-first-retry",
    
    // 테스트 환경 헤더 추가
    extraHTTPHeaders: {
      "X-Test-Environment": "e2e",
    },
  },

  // 다양한 브라우저 환경 테스트
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // 테스트 디렉토리를 명시적으로 제한
      testDir: path.join(__dirname, "tests"),
    },
    // GitHub Actions에서는 chromium만 사용하여 속도 향상
    ...(process.env.CI ? [] : [
      {
        name: "firefox",
        use: { ...devices["Desktop Firefox"] },
        testDir: path.join(__dirname, "tests"),
      },
      {
        name: "webkit",
        use: { ...devices["Desktop Safari"] },
        testDir: path.join(__dirname, "tests"),
      },
    ]),
  ],

  // 로컬 개발 서버 설정 (임시 비활성화)
  /*
  webServer: {
    command: "pnpm --filter apps/posmul-web dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    
    // 환경변수 설정
    env: {
      NODE_ENV: "test",
      // 테스트 환경변수 로드
      ...(process.env.CI ? {} : { 
        DOTENV_CONFIG_PATH: ".env.test" 
      }),
    },
  },
  */
  
  // 테스트 파일 패턴을 엄격하게 제한
  testMatch: [
    path.join(__dirname, "tests/**/*.spec.ts"),
    path.join(__dirname, "tests/**/*.e2e.ts"),
    path.join(__dirname, "e2e/**/*.spec.ts"),
    path.join(__dirname, "e2e/**/*.e2e.ts")
  ],
  
  // 절대 스캔하지 않을 패턴들
  testIgnore: [
    "**/node_modules/**",
    "**/packages/**",
    "**/apps/*/src/**",
    "**/__tests__/**",
    "**/*.test.*",
    "**/setup/**",
    "**/coverage/**",
    "**/jest.config.*",
    "../../packages/**",
    "../../apps/*/src/**",
    "../*/**",
    "*/packages/**"
  ],
});
