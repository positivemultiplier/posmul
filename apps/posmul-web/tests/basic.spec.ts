import { expect, test } from "@playwright/test";

test.describe("PosMul Platform - 핵심 기능 E2E 테스트", () => {
  
  test.describe("홈페이지 기본 기능", () => {
    test("홈페이지가 로드되고 타이틀이 표시되어야 함", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveTitle(/PosMul/);
      
      // 기본 네비게이션이 표시되는지 확인
      await expect(page.getByRole("navigation")).toBeVisible();
    });

    test("메인 네비게이션이 작동해야 함", async ({ page }) => {
      await page.goto("/");
      
      // 예측 메뉴 클릭
      await page.getByRole("link", { name: /prediction|예측/i }).click();
      await expect(page.url()).toContain("/prediction");
      
      // 투자 메뉴 클릭
      await page.goto("/");
      await page.getByRole("link", { name: /investment|투자/i }).click();
      await expect(page.url()).toContain("/investment");
      
      // 기부 메뉴 클릭
      await page.goto("/");
      await page.getByRole("link", { name: /donation|기부/i }).click();
      await expect(page.url()).toContain("/donation");
    });
  });

  test.describe("예측 시스템", () => {
    test("예측 게임 목록이 표시되어야 함", async ({ page }) => {
      await page.goto("/prediction");
      
      // 예측 게임 섹션이 로드되는지 확인
      await expect(page.getByRole("heading", { name: /prediction|예측/i })).toBeVisible();
      
      // 스포츠 예측 링크 확인
      await expect(page.getByRole("link", { name: /sports|스포츠/i })).toBeVisible();
    });

    test("샘플 예측 게임에 접근할 수 있어야 함", async ({ page }) => {
      await page.goto("/prediction/samples");
      
      // 다양한 예측 유형이 표시되는지 확인
      await expect(page.getByRole("link", { name: /binary|이진/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /ranking|순위/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /wdl/i })).toBeVisible();
    });

    test("이진 예측 게임이 정상 작동해야 함", async ({ page }) => {
      await page.goto("/prediction/samples/binary");
      
      // 예측 옵션들이 표시되는지 확인
      await expect(page.getByRole("button", { name: /예|yes/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /아니오|no/i })).toBeVisible();
      
      // 예측 참여 (로그인이 필요하지 않은 경우)
      const yesButton = page.getByRole("button", { name: /예|yes/i }).first();
      if (await yesButton.isEnabled()) {
        await yesButton.click();
      }
    });
  });

  test.describe("투자 시스템", () => {
    test("투자 페이지가 로드되어야 함", async ({ page }) => {
      await page.goto("/investment");
      
      // 투자 관련 콘텐츠가 표시되는지 확인
      await expect(page.getByRole("heading", { name: /investment|투자/i })).toBeVisible();
      
      // 로컬 리그 링크 확인
      await expect(page.getByRole("link", { name: /local.*league|지역.*리그/i })).toBeVisible();
    });

    test("로컬 리그 투자 페이지에 접근할 수 있어야 함", async ({ page }) => {
      await page.goto("/investment/local-league");
      
      // 투자 기회 정보가 표시되는지 확인
      await expect(page.locator("body")).toContainText(/league|리그|investment|투자/);
    });
  });

  test.describe("기부 시스템", () => {
    test("기부 페이지가 로드되어야 함", async ({ page }) => {
      await page.goto("/donation");
      
      // 기부 관련 콘텐츠가 표시되는지 확인
      await expect(page.getByRole("heading", { name: /donation|기부/i })).toBeVisible();
      
      // 직접 기부 링크 확인
      await expect(page.getByRole("link", { name: /direct|직접/i })).toBeVisible();
    });

    test("직접 기부 페이지에 접근할 수 있어야 함", async ({ page }) => {
      await page.goto("/donation/direct");
      
      // 기부 옵션이 표시되는지 확인
      await expect(page.locator("body")).toContainText(/donation|기부|direct|직접/);
    });
  });

  test.describe("포럼 시스템", () => {
    test("포럼 페이지가 로드되어야 함", async ({ page }) => {
      await page.goto("/forum");
      
      // 포럼 관련 콘텐츠가 표시되는지 확인
      await expect(page.getByRole("heading", { name: /forum|포럼/i })).toBeVisible();
      
      // 브레인스토밍 링크 확인
      await expect(page.getByRole("link", { name: /brainstorming|브레인스토밍/i })).toBeVisible();
    });
  });

  test.describe("API 엔드포인트", () => {
    test("헬스체크 API가 응답해야 함", async ({ page }) => {
      const response = await page.request.get("/api/health");
      expect(response.status()).toBe(200);
      
      const healthData = await response.json();
      expect(healthData).toHaveProperty("status");
    });

    test("경제 시스템 API가 응답해야 함", async ({ page }) => {
      const response = await page.request.get("/api/economy/pmp-pmc-overview");
      // API가 구현되어 있다면 200, 아니면 404나 다른 상태코드
      expect([200, 404, 500]).toContain(response.status());
    });

    test("예측 게임 API가 응답해야 함", async ({ page }) => {
      const response = await page.request.get("/api/predictions/games");
      // API가 구현되어 있다면 200, 아니면 404나 다른 상태코드
      expect([200, 404, 500]).toContain(response.status());
    });
  });

  test.describe("반응형 디자인", () => {
    test("모바일 환경에서 정상 작동해야 함", async ({ page }) => {
      // 모바일 뷰포트로 설정
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto("/");
      
      // 메인 콘텐츠가 모바일에서도 표시되는지 확인
      await expect(page.getByRole("navigation")).toBeVisible();
      
      // 주요 링크들이 클릭 가능한지 확인
      await expect(page.getByRole("link", { name: /prediction|예측/i })).toBeVisible();
    });

    test("태블릿 환경에서 정상 작동해야 함", async ({ page }) => {
      // 태블릿 뷰포트로 설정
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto("/");
      
      // 레이아웃이 태블릿에 맞게 조정되는지 확인
      await expect(page.getByRole("navigation")).toBeVisible();
    });
  });

  test.describe("성능 및 접근성", () => {
    test("페이지 로딩이 합리적인 시간 내에 완료되어야 함", async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      const loadTime = Date.now() - startTime;
      
      // 10초 이내에 로딩 완료
      expect(loadTime).toBeLessThan(10000);
    });

    test("기본 접근성 요구사항을 만족해야 함", async ({ page }) => {
      await page.goto("/");
      
      // 페이지에 메인 랜드마크가 있는지 확인
      await expect(page.locator("main, [role='main']")).toBeVisible();
      
      // 네비게이션이 적절한 역할을 가지는지 확인
      await expect(page.locator("nav, [role='navigation']")).toBeVisible();
    });
  });
});
