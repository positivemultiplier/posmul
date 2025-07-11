/**
 * Agency Theory Engine 사용 예제
 * Jensen & Meckling (1976) Agency Theory 기반 PmpAmount→PmcAmount 전환 실제 사용법
 */

import {
  AgencyTheoryConfig,
  AgencyTheoryEngine,
  IAgencyMetrics,
  IPredictionData,
  IPredictionParticipant,
} from "../services";
import { isFailure } from '@posmul/auth-economy-sdk';

import {
  createPmpAmount,
  createPredictionAccuracy,
  unwrapPmcAmount,
  unwrapPmpAmount,
} from "../value-objects";

/**
 * 기본 설정으로 Agency Theory Engine 초기화
 */
function createDefaultAgencyEngine(): AgencyTheoryEngine {
  const config: AgencyTheoryConfig = {
    baseConversionRate: 0.5, // 기본 50% 전환율
    maxConversionRate: 1.0, // 최대 100% 전환율
    socialLearningWeight: 0.3, // 사회적 학습 가중치
    accuracyWeight: 0.4, // 예측 정확도 가중치
    transparencyWeight: 0.3, // 정보 투명성 가중치
    agencyCostThreshold: 0.7, // Agency Cost 개선 임계값
  };

  return new AgencyTheoryEngine(config);
}

/**
 * 예측 게임 시나리오 1: 고품질 예측 참여
 */
async function example1_HighQualityPrediction() {
  console.log("=== 예시 1: 고품질 예측 게임 참여 ===");

  const engine = createDefaultAgencyEngine();

  // 투입할 PmpAmount 양
  const pmpInput = createPmpAmount(1000);

  // 고품질 예측 데이터
  const predictionData: IPredictionData = {
    predictionAccuracy: createPredictionAccuracy(0.85), // 85% 정확도
    socialLearningIndex: 0.8, // 높은 사회적 학습
    informationTransparency: 0.9, // 높은 투명성
  };

  // 우수한 참여자들
  const participants: IPredictionParticipant[] = [
    {
      userId: "expert-economist",
      predictionAccuracy: createPredictionAccuracy(0.9),
      participationCount: 50,
      consensusContribution: 0.95,
      reputationScore: 0.9,
    },
    {
      userId: "civic-leader",
      predictionAccuracy: createPredictionAccuracy(0.8),
      participationCount: 30,
      consensusContribution: 0.85,
      reputationScore: 0.8,
    },
    {
      userId: "data-scientist",
      predictionAccuracy: createPredictionAccuracy(0.88),
      participationCount: 25,
      consensusContribution: 0.9,
      reputationScore: 0.85,
    },
  ];

  // PmpAmount → PmcAmount 전환 실행
  const result = await engine.convertPmpAmountToPmcAmount(
    pmpInput,
    predictionData,
    participants
  );

  if (result.success) {
    const conversion = result.data;

    console.log(`투입 PmpAmount: ${unwrapPmpAmount(conversion.pmpInput)}`);
    console.log(`산출 PmcAmount: ${unwrapPmcAmount(conversion.pmcOutput).toFixed(2)}`);
    console.log(`전환율: ${(conversion.conversionRate * 100).toFixed(1)}%`);
    console.log(`보너스 배수: ${conversion.bonusMultiplier.toFixed(2)}`);
    console.log(
      `정보 비대칭 점수: ${conversion.agencyMetrics.informationAsymmetry.toFixed(
        3
      )}`
    );
    console.log(
      `Agent 정렬도: ${conversion.agencyMetrics.agentAlignment.toFixed(3)}`
    );
    console.log(
      `Agency Cost 감소: ${conversion.agencyMetrics.agencyCostReduction.toFixed(
        3
      )}`
    );
  } else {
    console.error("전환 실패:", isFailure(result) ? result.error.message : "Unknown error");
  }
}

/**
 * 예측 게임 시나리오 2: 저품질 예측 참여 (개선 필요 사례)
 */
async function example2_LowQualityPrediction() {
  console.log("\n=== 예시 2: 저품질 예측 게임 참여 (개선 필요) ===");

  const engine = createDefaultAgencyEngine();

  const pmpInput = createPmpAmount(1000);

  // 저품질 예측 데이터
  const predictionData: IPredictionData = {
    predictionAccuracy: createPredictionAccuracy(0.45), // 낮은 정확도
    socialLearningIndex: 0.3, // 낮은 사회적 학습
    informationTransparency: 0.4, // 낮은 투명성
  };

  // 신뢰도가 낮은 참여자들
  const participants: IPredictionParticipant[] = [
    {
      userId: "casual-user-1",
      predictionAccuracy: createPredictionAccuracy(0.4),
      participationCount: 3,
      consensusContribution: 0.2,
      reputationScore: 0.3,
    },
    {
      userId: "casual-user-2",
      predictionAccuracy: createPredictionAccuracy(0.5),
      participationCount: 1,
      consensusContribution: 0.1,
      reputationScore: 0.2,
    },
  ];

  const result = await engine.convertPmpAmountToPmcAmount(
    pmpInput,
    predictionData,
    participants
  );

  if (result.success) {
    const conversion = result.data;

    console.log(`투입 PmpAmount: ${unwrapPmpAmount(conversion.pmpInput)}`);
    console.log(`산출 PmcAmount: ${unwrapPmcAmount(conversion.pmcOutput).toFixed(2)}`);
    console.log(`전환율: ${(conversion.conversionRate * 100).toFixed(1)}%`);
    console.log(`보너스 배수: ${conversion.bonusMultiplier.toFixed(2)}`);

    // 개선 권장사항 생성
    const recommendations = engine.generateImprovementRecommendations(
      conversion.agencyMetrics
    );
    console.log("\n📋 개선 권장사항:");
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
}

/**
 * 예측 게임 시나리오 3: 시간에 따른 효과성 측정
 */
function example3_EffectivenessMeasurement() {
  console.log("\n=== 예시 3: 시간에 따른 Agency Theory 효과성 측정 ===");

  const engine = createDefaultAgencyEngine();

  // 3개월간의 예측 게임 메트릭 시뮬레이션
  const historicalMetrics: IAgencyMetrics[] = [];

  // 첫 달: 시스템 초기 상태 (낮은 성능)
  for (let i = 0; i < 30; i++) {
    historicalMetrics.push({
      informationAsymmetry: 0.7 + Math.random() * 0.2,
      agentAlignment: 0.3 + Math.random() * 0.2,
      agencyCostReduction: 0.4 + Math.random() * 0.2,
      predictionAccuracy: 0.5 + Math.random() * 0.2,
      socialLearningIndex: 0.4 + Math.random() * 0.2,
      informationTransparency: 0.5 + Math.random() * 0.2,
    });
  }

  // 둘째 달: 점진적 개선
  for (let i = 0; i < 30; i++) {
    historicalMetrics.push({
      informationAsymmetry: 0.5 + Math.random() * 0.2,
      agentAlignment: 0.5 + Math.random() * 0.2,
      agencyCostReduction: 0.6 + Math.random() * 0.2,
      predictionAccuracy: 0.6 + Math.random() * 0.2,
      socialLearningIndex: 0.6 + Math.random() * 0.2,
      informationTransparency: 0.7 + Math.random() * 0.2,
    });
  }

  // 셋째 달: 고성능 상태
  for (let i = 0; i < 30; i++) {
    historicalMetrics.push({
      informationAsymmetry: 0.2 + Math.random() * 0.2,
      agentAlignment: 0.7 + Math.random() * 0.2,
      agencyCostReduction: 0.8 + Math.random() * 0.2,
      predictionAccuracy: 0.8 + Math.random() * 0.1,
      socialLearningIndex: 0.8 + Math.random() * 0.1,
      informationTransparency: 0.9 + Math.random() * 0.1,
    });
  }

  // 효과성 측정 (최근 30일간 분석)
  const effectiveness = engine.measureEffectiveness(historicalMetrics, 30);

  console.log(
    `Agency Cost 개선 추세: ${effectiveness.agencyCostTrend.toFixed(3)}`
  );
  console.log(
    `정보 대칭성 개선도: ${effectiveness.informationSymmetryImprovement.toFixed(
      3
    )}`
  );
  console.log(
    `참여 증가율: ${(effectiveness.participationGrowthRate * 100).toFixed(1)}%`
  );
  console.log(
    `종합 효과성: ${(effectiveness.overallEffectiveness * 100).toFixed(1)}%`
  );

  // 효과성 평가
  if (effectiveness.overallEffectiveness > 0.8) {
    console.log("🎉 Agency Theory 시스템이 매우 효과적으로 작동 중입니다!");
  } else if (effectiveness.overallEffectiveness > 0.6) {
    console.log("✅ Agency Theory 시스템이 잘 작동하고 있습니다.");
  } else if (effectiveness.overallEffectiveness > 0.4) {
    console.log("⚠️ Agency Theory 시스템에 일부 개선이 필요합니다.");
  } else {
    console.log("❌ Agency Theory 시스템에 대대적인 개선이 필요합니다.");
  }
}

/**
 * 실전 사용 예제: 정책 결정 예측 게임
 */
async function example4_PolicyPredictionGame() {
  console.log("\n=== 예시 4: 실전 - 지역 교통 정책 예측 게임 ===");

  const engine = createDefaultAgencyEngine();

  // 시나리오: 지역 교통 개선 정책의 효과 예측
  const pmpInvestment = createPmpAmount(5000); // 5,000 PmpAmount 투자

  const policyPredictionData: IPredictionData = {
    predictionAccuracy: createPredictionAccuracy(0.72), // 정책 예측은 복잡
    socialLearningIndex: 0.65, // 시민들의 적극적 참여
    informationTransparency: 0.8, // 정부의 높은 투명성
  };

  // 다양한 배경의 시민 참여자들
  const citizenParticipants: IPredictionParticipant[] = [
    // 교통 전문가
    {
      userId: "traffic-engineer",
      predictionAccuracy: createPredictionAccuracy(0.85),
      participationCount: 40,
      consensusContribution: 0.9,
      reputationScore: 0.95,
    },
    // 지역 주민
    {
      userId: "local-resident-1",
      predictionAccuracy: createPredictionAccuracy(0.65),
      participationCount: 15,
      consensusContribution: 0.7,
      reputationScore: 0.6,
    },
    {
      userId: "local-resident-2",
      predictionAccuracy: createPredictionAccuracy(0.7),
      participationCount: 20,
      consensusContribution: 0.75,
      reputationScore: 0.65,
    },
    // 경제학자
    {
      userId: "policy-economist",
      predictionAccuracy: createPredictionAccuracy(0.8),
      participationCount: 35,
      consensusContribution: 0.85,
      reputationScore: 0.9,
    },
    // 일반 시민들
    {
      userId: "citizen-activist",
      predictionAccuracy: createPredictionAccuracy(0.6),
      participationCount: 10,
      consensusContribution: 0.6,
      reputationScore: 0.5,
    },
  ];

  const result = await engine.convertPmpAmountToPmcAmount(
    pmpInvestment,
    policyPredictionData,
    citizenParticipants
  );

  if (result.success) {
    const conversion = result.data;

    console.log("\n📊 정책 예측 게임 결과:");
    console.log(
      `투자된 PmpAmount: ${unwrapPmpAmount(conversion.pmpInput).toLocaleString()}`
    );
    console.log(`획득한 PmcAmount: ${unwrapPmcAmount(conversion.pmcOutput).toFixed(2)}`);
    console.log(
      `실제 전환율: ${(conversion.conversionRate * 100).toFixed(1)}%`
    );
    console.log(
      `집단지성 보너스: ${((conversion.bonusMultiplier - 1) * 100).toFixed(1)}%`
    );

    console.log("\n📈 Jensen & Meckling Agency Theory 분석:");
    console.log(
      `정보 비대칭 해소도: ${(
        (1 - conversion.agencyMetrics.informationAsymmetry) *
        100
      ).toFixed(1)}%`
    );
    console.log(
      `Principal-Agent 정렬도: ${(
        conversion.agencyMetrics.agentAlignment * 100
      ).toFixed(1)}%`
    );
    console.log(
      `Agency Cost 감소효과: ${(
        conversion.agencyMetrics.agencyCostReduction * 100
      ).toFixed(1)}%`
    );

    // ROI 계산
    const roi =
      ((unwrapPmcAmount(conversion.pmcOutput) - unwrapPmpAmount(conversion.pmpInput)) /
        unwrapPmpAmount(conversion.pmpInput)) *
      100;
    console.log(`\n💰 투자 수익률 (ROI): ${roi.toFixed(1)}%`);

    if (roi > 0) {
      console.log(
        "✅ 정책 예측 게임을 통한 집단지성 활용이 경제적 가치를 창출했습니다!"
      );
    }

    // 개선 권장사항
    const recommendations = engine.generateImprovementRecommendations(
      conversion.agencyMetrics
    );
    if (recommendations.length > 0) {
      console.log("\n🔧 추가 개선 권장사항:");
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
  }
}

// 모든 예제 실행
export async function runAgencyTheoryExamples() {
  console.log("🏛️ Jensen & Meckling Agency Theory Engine 실행 예제\n");

  await example1_HighQualityPrediction();
  await example2_LowQualityPrediction();
  example3_EffectivenessMeasurement();
  await example4_PolicyPredictionGame();

  console.log("\n✅ 모든 Agency Theory 예제가 완료되었습니다!");
  console.log(
    "\n이 시스템은 다음 Nobel Prize Winner들의 이론을 기반으로 합니다:"
  );
  console.log(
    '📚 Michael Jensen & William Meckling (1976) - "Theory of the Firm: Managerial Behavior, Agency Costs and Ownership Structure"'
  );
  console.log(
    "🏆 이들의 Agency Theory는 현대 기업 지배구조 이론의 기초가 되었습니다."
  );
}

// 실행 (Node.js 환경에서)
if (require.main === module) {
  runAgencyTheoryExamples().catch(console.error);
}
