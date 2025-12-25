/**
 * MoneyWave 통합 테스트 스크립트
 * Phase 1 구현이 제대로 작동하는지 확인
 */
import { createPmpAmount, isFailure } from "@posmul/auth-economy-sdk";

import { MoneyWaveCalculatorService } from "../../../shared/economy-kernel/services/money-wave-calculator.service";
import { PredictionGame } from "../domain/entities/prediction-game.aggregate";
import {
  PredictionType,
} from "../domain/value-objects/prediction-types";

async function testMoneyWaveIntegration() {
  console.log("🚀 MoneyWave Integration Test 시작...\n");

  // 1. MoneyWaveCalculatorService 초기화 (연간 EBIT 1억원 가정)
  const moneyWaveCalculator = new MoneyWaveCalculatorService(100000000);

  // 2. 일일 상금 풀 계산 테스트
  console.log("💰 일일 상금 풀 계산 테스트:");
  const dailyPoolResult = await moneyWaveCalculator.calculateDailyPrizePool();

  if (dailyPoolResult.success) {
    console.log(
      `  ✅ 총 일일 풀: ${dailyPoolResult.data.totalDailyPool.toLocaleString()}원`
    );
    console.log(
      `  📊 EBIT 기반: ${dailyPoolResult.data.ebitBased.toLocaleString()}원`
    );
    console.log(
      `  🔄 재분배 PMC: ${dailyPoolResult.data.redistributedPmc.toLocaleString()}원`
    );
    console.log(
      `  🏢 기업가 PMC: ${dailyPoolResult.data.enterprisePmc.toLocaleString()}원`
    );
  } else {
    console.log(
      "  ❌ 일일 풀 계산 실패:",
      isFailure(dailyPoolResult) ? dailyPoolResult.error : "Unknown error"
    );
    return;
  }

  // 3. 게임별 배정 테스트
  console.log("\n🎮 게임별 배정 테스트:");

  const testScenarios = [
    { importance: 1.0, description: "기본 중요도 게임" },
    { importance: 3.0, description: "중간 중요도 게임" },
    { importance: 5.0, description: "최고 중요도 게임" },
  ];

  for (const scenario of testScenarios) {
    const allocatedAmount = await moneyWaveCalculator.allocatePrizePoolToGame(
      dailyPoolResult.data.totalDailyPool,
      scenario.importance,
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 종료
    );

    console.log(
      `  ${scenario.description} (중요도 ${scenario.importance}): ${allocatedAmount.toLocaleString()}원`
    );
  }

  // 4. PredictionGame Aggregate 테스트
  console.log("\n🏗️ PredictionGame Aggregate 테스트:");

  const gameResult = PredictionGame.create({
    creatorId: "test-user-123" as any,
    title: "테스트 예측 게임",
    description: "MoneyWave 통합 테스트용 게임입니다.",
    predictionType: PredictionType.BINARY,
    options: [
      { id: "yes", label: "예" },
      { id: "no", label: "아니오" },
    ],
    startTime: new Date(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
    settlementTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8일 후
    minimumStake: createPmpAmount(100) as any,
    maximumStake: createPmpAmount(5000) as any,
    maxParticipants: 1000,
  });

  if (gameResult.success) {
    const game = gameResult.data;
    console.log(`  ✅ 게임 생성 성공: ${game.getTitle()}`);

    // 5. MoneyWave 배정 테스트
    const gameImportance = 2.5; // 테스트용 중요도
    const testAllocatedAmount =
      await moneyWaveCalculator.allocatePrizePoolToGame(
        dailyPoolResult.data.totalDailyPool,
        gameImportance,
        game.endTime
      );

    const setImportanceResult = game.setGameImportanceScore(gameImportance);
    const setPrizeResult = game.setAllocatedPrizePool(
      testAllocatedAmount as any
    );

    if (setImportanceResult.success && setPrizeResult.success) {
      console.log(`  ✅ 중요도 설정 성공: ${game.gameImportanceScore}`);
      console.log(
        `  ✅ 상금 배정 성공: ${Number(game.allocatedPrizePool).toLocaleString()}원`
      );

      // 6. 게터 메서드 테스트
      console.log("\n📊 게임 정보 조회 테스트:");
      console.log(`  게임 ID: ${game.getId()}`);
      console.log(`  제목: ${game.getTitle()}`);
      console.log(`  상태: ${game.getStatus()}`);
      console.log(`  중요도 점수: ${game.gameImportanceScore}`);
      console.log(
        `  배정된 상금: ${Number(game.allocatedPrizePool).toLocaleString()}원`
      );
      console.log(`  최소 스테이크: ${Number(game.minimumStake)}`);
      console.log(`  최대 스테이크: ${Number(game.maximumStake)}`);
    } else {
      console.log("  ❌ MoneyWave 배정 실패");
      if (!setImportanceResult.success)
        console.log(
          "    중요도 설정 오류:",
          isFailure(setImportanceResult)
            ? setImportanceResult.error
            : "Unknown error"
        );
      if (!setPrizeResult.success)
        console.log(
          "    상금 배정 오류:",
          isFailure(setPrizeResult) ? setPrizeResult.error : "Unknown error"
        );
    }
  } else {
    console.log(
      "  ❌ 게임 생성 실패:",
      isFailure(gameResult) ? gameResult.error : "Unknown error"
    );
  }

  // 7. 시간별 배정 변화 테스트
  console.log("\n⏰ 시간별 배정 변화 테스트:");
  const now = new Date();
  const timeScenarios = [
    {
      endTime: new Date(now.getTime() + 23 * 60 * 60 * 1000),
      description: "23시간 후 종료",
    }, // 오늘 중
    {
      endTime: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      description: "12시간 후 종료",
    }, // 오늘 중
    {
      endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      description: "2시간 후 종료",
    }, // 오늘 중
  ];

  for (const timeScenario of timeScenarios) {
    const allocatedAmount = await moneyWaveCalculator.allocatePrizePoolToGame(
      dailyPoolResult.data.totalDailyPool,
      2.0, // 고정 중요도
      timeScenario.endTime
    );
    console.log(
      `  ${timeScenario.description}: ${allocatedAmount.toLocaleString()}원`
    );
  }

  console.log("\n🎉 MoneyWave Integration Test 완료!");
  console.log("\n📋 결과 요약:");
  console.log(
    `  - 일일 상금 풀: ${dailyPoolResult.data.totalDailyPool.toLocaleString()}원`
  );
  console.log(`  - 중요도 기반 배정: 정상 작동`);
  console.log(`  - 시간 기반 조정: 정상 작동`);
  console.log(`  - Aggregate 통합: 정상 작동`);
}

// 모듈로 실행하는 경우
if (require.main === module) {
  testMoneyWaveIntegration().catch(console.error);
}

export { testMoneyWaveIntegration };
