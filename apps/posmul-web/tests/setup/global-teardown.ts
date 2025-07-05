import { FullConfig } from "@playwright/test";
import { teardownTestEnvironment } from "./test-db";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Starting E2E test environment cleanup...");
  
  try {
    // 테스트 데이터베이스 정리
    console.log("🗄️ Cleaning up test database...");
    await teardownTestEnvironment();
    console.log("✅ Test database cleanup complete");
    
  } catch (error) {
    console.error("❌ Global teardown failed:", error);
    // 정리 실패는 로그만 남기고 진행
  }
  
  console.log("🎉 E2E test environment cleanup completed!");
}

export default globalTeardown; 