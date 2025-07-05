import { chromium, FullConfig } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { setupTestEnvironment } from "./test-db";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting E2E test environment setup...");
  
  // 테스트 환경변수 로드
  const envPath = path.join(process.cwd(), ".env.test");
  dotenv.config({ path: envPath });
  
  // 브라우저 초기화 (필요한 경우)
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 앱이 실행될 때까지 대기
    console.log("⏳ Waiting for app to be ready...");
    await page.goto("http://localhost:3000", { 
      waitUntil: "networkidle",
      timeout: 30000,
    });
    
    // 기본 페이지 로드 확인
    await page.waitForSelector("body", { timeout: 10000 });
    console.log("✅ App is ready");
    
    // 테스트 데이터베이스 환경 설정
    console.log("🗄️ Setting up test database...");
    await setupTestEnvironment();
    console.log("✅ Test database setup complete");
    
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log("🎉 E2E test environment setup completed successfully!");
}

export default globalSetup; 