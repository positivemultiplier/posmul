import { createClient } from "@supabase/supabase-js";

// 테스트용 Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-key";

export const testDb = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 테스트 데이터 정리 함수
export async function cleanupTestData() {
  try {
    // 테스트 관련 데이터 정리 (실제 환경에 맞게 수정)
    const tables = [
      'prediction_games',
      'investment_opportunities', 
      'donation_campaigns',
      'user_profiles',
      'economic_transactions'
    ];

    for (const table of tables) {
      const { error } = await testDb
        .from(table)
        .delete()
        .contains('metadata', { test: true });
      
      if (error && !error.message.includes('does not exist')) {
        console.warn(`Warning: Could not cleanup table ${table}:`, error.message);
      }
    }
  } catch (error) {
    console.warn("Warning: Test data cleanup failed:", error);
  }
}

// 테스트 사용자 생성
export async function createTestUser(email: string, password: string) {
  try {
    const { data, error } = await testDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        test_user: true,
        created_for_e2e: true,
      },
    });

    if (error) {
      console.warn(`Warning: Could not create test user ${email}:`, error.message);
      return null;
    }

    return data.user;
  } catch (error) {
    console.warn("Warning: Test user creation failed:", error);
    return null;
  }
}

// 테스트 데이터 시드
export async function seedTestData() {
  try {
    // 예측 게임 샘플 데이터
    const sampleGames = [
      {
        title: "테스트 이진 예측",
        description: "E2E 테스트용 이진 예측 게임",
        type: "binary",
        status: "active",
        metadata: { test: true },
      },
      {
        title: "테스트 순위 예측", 
        description: "E2E 테스트용 순위 예측 게임",
        type: "ranking",
        status: "active",
        metadata: { test: true },
      },
    ];

    // 투자 기회 샘플 데이터
    const sampleInvestments = [
      {
        title: "테스트 로컬 리그",
        description: "E2E 테스트용 투자 기회",
        category: "local_league",
        status: "active",
        metadata: { test: true },
      },
    ];

    // 기부 캠페인 샘플 데이터
    const sampleDonations = [
      {
        title: "테스트 직접 기부",
        description: "E2E 테스트용 기부 캠페인",
        category: "direct",
        status: "active", 
        metadata: { test: true },
      },
    ];

    // 데이터 삽입 (테이블이 존재하는 경우에만)
    const insertData = async (table: string, data: any[]) => {
      try {
        const { error } = await testDb.from(table).insert(data);
        if (error && !error.message.includes('does not exist')) {
          console.warn(`Warning: Could not seed ${table}:`, error.message);
        }
      } catch (error) {
        console.warn(`Warning: Could not seed ${table}:`, error);
      }
    };

    await insertData('prediction_games', sampleGames);
    await insertData('investment_opportunities', sampleInvestments);
    await insertData('donation_campaigns', sampleDonations);

    console.log("Test data seeded successfully");
  } catch (error) {
    console.warn("Warning: Test data seeding failed:", error);
  }
}

// 테스트 환경 초기화
export async function setupTestEnvironment() {
  console.log("Setting up E2E test environment...");
  
  // 기존 테스트 데이터 정리
  await cleanupTestData();
  
  // 테스트 사용자 생성
  const testUserEmail = process.env.E2E_TEST_USER_EMAIL || "test@example.com";
  const testUserPassword = process.env.E2E_TEST_USER_PASSWORD || "testpassword123";
  await createTestUser(testUserEmail, testUserPassword);
  
  // 관리자 테스트 사용자 생성
  const adminEmail = process.env.E2E_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || "adminpassword123";
  await createTestUser(adminEmail, adminPassword);
  
  // 테스트 데이터 시드
  if (process.env.SEED_TEST_DATA === "true") {
    await seedTestData();
  }
  
  console.log("E2E test environment setup completed");
}

// 테스트 환경 정리
export async function teardownTestEnvironment() {
  console.log("Tearing down E2E test environment...");
  
  // 테스트 데이터 정리
  await cleanupTestData();
  
  // 테스트 사용자 정리 (옵션)
  try {
    const testUserEmail = process.env.E2E_TEST_USER_EMAIL || "test@example.com";
    const adminEmail = process.env.E2E_ADMIN_EMAIL || "admin@example.com";
    
    // 실제 프로덕션에서는 사용자 삭제를 조심스럽게 해야 함
    console.log(`Test users ${testUserEmail}, ${adminEmail} cleanup skipped for safety`);
  } catch (error) {
    console.warn("Warning: Test user cleanup failed:", error);
  }
  
  console.log("E2E test environment teardown completed");
} 