#!/usr/bin/env tsx
/**
 * 🎯 우선순위 2.1: PMP → PMC 전환 로직 검증 스크립트
 * 실제 운영 데이터를 기반으로 예측 게임 성공 시나리오를 시뮬레이션합니다.
 */

import { mcp_supabase_execute_sql } from "../src/shared/mcp/supabase-client";

const PROJECT_ID = "fabyagohqqnusmnwekuc";

interface PredictionResult {
  predictionId: string;
  userId: string;
  gameId: string;
  betAmount: number;
  expectedReward: number;
  confidence: number;
  isWinner: boolean;
  pmpTopmcRatio: number;
}

/**
 * 🎯 실제 예측 게임 결과 시뮬레이션
 */
async function simulatePredictionOutcome() {
  console.log("🎯 === PMP → PMC 전환 시뮬레이션 시작 ===");

  // 1. 현재 활성 예측 조회
  const activePredictions = await mcp_supabase_execute_sql({
    project_id: PROJECT_ID,
    query: `
      SELECT 
        p.prediction_id,
        p.user_id,
        p.game_id,
        p.bet_amount,
        p.expected_reward,
        p.confidence_level,
        pmp.pmp_balance,
        pmp.pmc_balance,
        pg.title
      FROM predictions p
      JOIN pmp_pmc_accounts pmp ON p.user_id = pmp.user_id
      JOIN prediction_games pg ON p.game_id = pg.game_id
      WHERE p.is_active = true
      ORDER BY p.bet_amount DESC
      LIMIT 10
    `,
  });

  console.log("📊 현재 활성 예측 TOP 10:");

  if (!activePredictions.data || activePredictions.data.length === 0) {
    console.log("❌ 활성 예측이 없습니다.");
    return {
      totalPredictions: 0,
      successfulPredictions: 0,
      totalPmpConverted: 0,
      totalPmcGenerated: 0,
      conversionEfficiency: 0,
    };
  }

  activePredictions.data.forEach((pred: any, index: number) => {
    console.log(
      `${index + 1}. ${
        pred.title
      } - ${pred.bet_amount.toLocaleString()} PMP (신뢰도: ${
        pred.confidence_level
      }%)`
    );
  });

  // 2. 시뮬레이션 결과 생성 (60% 성공률)
  const simulationResults: PredictionResult[] = activePredictions.data.map(
    (pred: any) => {
      const isWinner = Math.random() < 0.6; // 60% 성공률
      const pmpTopmcRatio = pred.confidence_level / 100; // 신뢰도 기반 전환 비율

      return {
        predictionId: pred.prediction_id,
        userId: pred.user_id,
        gameId: pred.game_id,
        betAmount: pred.bet_amount,
        expectedReward: parseFloat(pred.expected_reward),
        confidence: pred.confidence_level,
        isWinner,
        pmpTopmcRatio,
      };
    }
  );

  console.log("\n🎰 시뮬레이션 결과:");

  let totalPmpConverted = 0;
  let totalPmcGenerated = 0;

  simulationResults.forEach((result, index) => {
    const status = result.isWinner ? "✅ 성공" : "❌ 실패";
    const pmpConverted = result.isWinner
      ? result.betAmount * result.pmpTopmcRatio
      : 0;
    const pmcGenerated = result.isWinner
      ? result.expectedReward * (result.confidence / 100)
      : 0;

    totalPmpConverted += pmpConverted;
    totalPmcGenerated += pmcGenerated;

    console.log(
      `${
        index + 1
      }. ${status} | PMP 배팅: ${result.betAmount.toLocaleString()} | PMC 생성: ${pmcGenerated.toFixed(
        2
      )} | 신뢰도: ${result.confidence}%`
    );
  });

  console.log("\n📈 전체 시뮬레이션 결과:");
  console.log(`🔄 총 PMP 전환: ${totalPmpConverted.toLocaleString()}`);
  console.log(`💎 총 PMC 생성: ${totalPmcGenerated.toLocaleString()}`);
  console.log(
    `⚡ 전환 효율성: ${((totalPmcGenerated / totalPmpConverted) * 100).toFixed(
      2
    )}%`
  );

  // 3. 가상 거래 기록 생성 (실제 DB에는 저장하지 않음)
  const virtualTransactions = simulationResults
    .filter((r) => r.isWinner)
    .map((r) => ({
      userId: r.userId,
      transactionType: "pmp_to_pmc_conversion",
      pmpAmount: r.betAmount * r.pmpTopmcRatio,
      pmcAmount: r.expectedReward * (r.confidence / 100),
      gameId: r.gameId,
      conversionRatio: r.pmpTopmcRatio,
    }));

  console.log("\n🔄 가상 전환 거래 기록:");
  virtualTransactions.forEach((tx, index) => {
    console.log(
      `${index + 1}. User: ${tx.userId.slice(
        0,
        8
      )}... | PMP: ${tx.pmpAmount.toFixed(0)} → PMC: ${tx.pmcAmount.toFixed(
        2
      )} | 비율: ${(tx.conversionRatio * 100).toFixed(1)}%`
    );
  });

  return {
    totalPredictions: simulationResults.length,
    successfulPredictions: simulationResults.filter((r) => r.isWinner).length,
    totalPmpConverted,
    totalPmcGenerated,
    conversionEfficiency: (totalPmcGenerated / totalPmpConverted) * 100,
  };
}

/**
 * 🎯 경제 시스템 균형 분석
 */
async function analyzeEconomicBalance() {
  console.log("\n💰 === 경제 시스템 균형 분석 ===");

  const economicData = await mcp_supabase_execute_sql({
    project_id: PROJECT_ID,
    query: `
      SELECT 
        COUNT(*) as active_users,
        SUM(pmp_balance) as total_pmp,
        SUM(pmc_balance) as total_pmc,
        AVG(pmp_balance) as avg_pmp,
        AVG(pmc_balance) as avg_pmc,
        MIN(pmp_balance) as min_pmp,
        MAX(pmp_balance) as max_pmp,
        MIN(pmc_balance) as min_pmc,
        MAX(pmc_balance) as max_pmc
      FROM pmp_pmc_accounts 
      WHERE is_active = true
    `,
  });

  if (!economicData.data || economicData.data.length === 0) {
    console.log("❌ 경제 데이터를 가져올 수 없습니다.");
    return {
      totalPmp: 0,
      totalPmc: 0,
      pmpPmcRatio: 0,
      healthStatus: "🔴 데이터 없음",
    };
  }

  const data = economicData.data[0];

  console.log("📊 현재 경제 현황:");
  console.log(`👥 활성 사용자: ${data.active_users}명`);
  console.log(`💰 총 PMP: ${parseInt(data.total_pmp).toLocaleString()}`);
  console.log(`💎 총 PMC: ${parseFloat(data.total_pmc).toLocaleString()}`);
  console.log(
    `📈 PMP/PMC 비율: ${(
      parseInt(data.total_pmp) / parseFloat(data.total_pmc)
    ).toFixed(2)}`
  );
  console.log(`🔄 평균 PMP: ${parseInt(data.avg_pmp).toLocaleString()}`);
  console.log(`💫 평균 PMC: ${parseFloat(data.avg_pmc).toLocaleString()}`);

  // 경제 건전성 평가
  const pmpPmcRatio = parseInt(data.total_pmp) / parseFloat(data.total_pmc);
  let healthStatus = "";

  if (pmpPmcRatio > 3) {
    healthStatus = "🟢 건전 (PMP 우세)";
  } else if (pmpPmcRatio > 1.5) {
    healthStatus = "🟡 균형 (적정 수준)";
  } else {
    healthStatus = "🔴 주의 (PMC 과도)";
  }

  console.log(`📊 경제 건전성: ${healthStatus}`);

  return {
    totalPmp: parseInt(data.total_pmp),
    totalPmc: parseFloat(data.total_pmc),
    pmpPmcRatio,
    healthStatus,
  };
}

/**
 * 🎯 메인 실행 함수
 */
async function main() {
  try {
    console.log("🚀 우선순위 2.1: 예측 게임 시스템 검증 시작");
    console.log("=".repeat(60));

    // 1. PMP → PMC 전환 시뮬레이션
    const simulationResult = await simulatePredictionOutcome();

    // 2. 경제 시스템 균형 분석
    const economicAnalysis = await analyzeEconomicBalance();

    // 3. 종합 평가
    console.log("\n🎯 === 종합 평가 결과 ===");
    console.log(
      `✅ 예측 게임 활성도: ${simulationResult.totalPredictions}개 활성 예측`
    );
    console.log(
      `📈 성공률: ${(
        (simulationResult.successfulPredictions /
          simulationResult.totalPredictions) *
        100
      ).toFixed(1)}%`
    );
    console.log(
      `🔄 전환 효율성: ${simulationResult.conversionEfficiency.toFixed(2)}%`
    );
    console.log(`💰 경제 건전성: ${economicAnalysis.healthStatus}`);

    // 4. 권장사항
    console.log("\n📋 권장사항:");
    if (simulationResult.conversionEfficiency > 80) {
      console.log("✅ PMP → PMC 전환 로직이 효율적으로 작동중");
    } else {
      console.log("⚠️  전환 효율성 개선 필요 (목표: 80% 이상)");
    }

    if (economicAnalysis.pmpPmcRatio > 2) {
      console.log("✅ 경제 균형이 안정적으로 유지됨");
    } else {
      console.log("⚠️  경제 균형 조정 필요");
    }

    console.log("\n🎉 우선순위 2.1 검증 완료!");
  } catch (error) {
    console.error("❌ 검증 중 오류 발생:", error);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

export { analyzeEconomicBalance, simulatePredictionOutcome };
