/**
 * Economic Value Objects - Usage Examples
 * 경제 값 객체들의 사용 예제와 테스트
 *
 * 이 파일은 구현된 Value Objects들이 올바르게 작동하는지 확인하기 위한 예제입니다.
 */
import {
  MoneyWaveType,
  calculateCAPMReturn,
  calculateIndividualUtility,
  createActiveUserCount,
  createAgencyCostReduction,
  createAgentAlignmentRatio,
  createBetaCoefficient,
  createEBIT,
  createEndowmentAttachment,
  createGiniCoefficient,
  // Agency Theory
  createInformationAsymmetryScore,
  // Behavioral Economics
  createLossAversionCoefficient,
  createMarketRiskPremium,
  createMetcalfeValue,
  createMoneyWaveAmount,
  createMoneyWaveId,
  // Network Economics
  createNetworkDensity,
  createPmcAmount,
  // 핵심 화폐 시스템
  createPmpAmount,
  createProspectValue,
  createReedValue,
  // CAPM
  createRiskFreeRate,
  // 효용함수
  createUtilityAlpha,
  createUtilityBeta,
  createUtilityGamma,
  unwrapPmcAmount,
  // 유틸리티
  unwrapPmpAmount,
} from "./index";

/**
 * 예제 1: 기본 PmpAmount/PmcAmount 생성 및 사용
 */
export function exampleBasicCurrency() {
  console.log("=== 기본 화폐 시스템 예제 ===");

  // PmpAmount 생성 (위험프리 자산)
  const userPmpAmount = createPmpAmount(1000);
  console.log(`User PmpAmount: ${unwrapPmpAmount(userPmpAmount)} points`);

  // PmcAmount 생성 (위험자산)
  const userPmcAmount = createPmcAmount(250.75);
  console.log(`User PmcAmount: ${unwrapPmcAmount(userPmcAmount)} coins`);

  // EBIT 생성
  const companyEBIT = createEBIT(1000000);
  console.log(`Company EBIT: ${companyEBIT}`);

  // MoneyWave 생성
  const waveId = createMoneyWaveId(MoneyWaveType.WAVE1, new Date());
  const waveAmount = createMoneyWaveAmount(500.0);
  console.log(`MoneyWave ${waveId}: ${waveAmount} PmcAmount distributed`);
}

/**
 * 예제 2: Agency Theory 메커니즘
 */
export function exampleAgencyTheory() {
  console.log("=== Agency Theory 예제 ===");

  // 정보 비대칭 점수 (높을수록 나쁨)
  const asymmetryScore = createInformationAsymmetryScore(0.7);
  console.log(`Information Asymmetry: ${asymmetryScore * 100}%`);

  // Agent 정렬 비율 (높을수록 좋음)
  const alignmentRatio = createAgentAlignmentRatio(0.6);
  console.log(`Agent Alignment: ${alignmentRatio * 100}%`);

  // Agency Cost 감소율 계산
  const costReduction = createAgencyCostReduction(
    (alignmentRatio as number) * (1 - (asymmetryScore as number))
  );
  console.log(`Agency Cost Reduction: ${costReduction * 100}%`);
}

/**
 * 예제 3: CAPM 기반 위험-수익 계산
 */
export function exampleCAPM() {
  console.log("=== CAPM 위험-수익 계산 예제 ===");

  // CAPM 파라미터 설정
  const riskFreeRate = createRiskFreeRate(0.02); // 2% 연수익률
  const marketRiskPremium = createMarketRiskPremium(0.06); // 6% 위험프리미엄
  const beta = createBetaCoefficient(1.2); // 베타 1.2

  // 기대수익률 계산: E[R] = Rf + β(Rm - Rf)
  const expectedReturn = calculateCAPMReturn(
    riskFreeRate,
    beta,
    marketRiskPremium
  );

  console.log(`Risk-Free Rate: ${riskFreeRate * 100}%`);
  console.log(`Market Risk Premium: ${marketRiskPremium * 100}%`);
  console.log(`Beta Coefficient: ${beta}`);
  console.log(`Expected Return: ${expectedReturn * 100}%`);
}

/**
 * 예제 4: Behavioral Economics (손실회피)
 */
export function exampleBehavioralEconomics() {
  console.log("=== Behavioral Economics 예제 ===");

  // Kahneman-Tversky 손실회피 계수
  const lossAversion = createLossAversionCoefficient(); // 기본값 2.25
  console.log(`Loss Aversion Coefficient: ${lossAversion}`);

  // PmpAmount → PmcAmount 전환 시 Prospect Value 계산
  const pmcGain = 100; // PmcAmount 100 획득
  const pmpLoss = 50; // PmpAmount 50 소모

  // 가치함수: v(x) = x^α (이득), -λ(-x)^β (손실)
  const gainValue = Math.pow(pmcGain, 0.88); // α = 0.88
  const lossValue = -(lossAversion as number) * Math.pow(pmpLoss, 0.88);

  const prospectValue = createProspectValue(gainValue + lossValue);
  console.log(`Prospect Value: ${prospectValue}`);
  console.log("Invalid state");

  // Endowment Effect
  const endowmentAttachment = createEndowmentAttachment(0.3);
  console.log(`Endowment Attachment: ${endowmentAttachment * 100}%`);
}

/**
 * 예제 5: Network Economics (Metcalfe's Law)
 */
export function exampleNetworkEconomics() {
  console.log("=== Network Economics 예제 ===");

  // 활성 사용자 및 네트워크 밀도
  const activeUsers = createActiveUserCount(1000);
  const networkDensity = createNetworkDensity(0.3);

  // Metcalfe's Law: 네트워크 가치 = n² × √density
  const metcalfeValue = createMetcalfeValue(
    activeUsers as number,
    networkDensity as number
  );
  console.log(`Active Users: ${activeUsers}`);
  console.log(`Network Density: ${networkDensity * 100}%`);
  console.log(`Metcalfe Value: ${metcalfeValue.toLocaleString()}`);

  // Reed's Law: 2^n (부분집합의 가치)
  const reedValue = createReedValue(15); // 참여자 15명
  console.log(`Reed's Law Value: ${reedValue.toLocaleString()}`);
}

/**
 * 예제 6: 개인 효용함수 계산
 */
export function exampleUtilityFunction() {
  console.log("=== 개인 효용함수 예제 ===");

  // 효용함수 계수들
  const alpha = createUtilityAlpha(0.5); // PmpAmount 한계효용
  const beta = createUtilityBeta(0.3); // PmcAmount 한계효용
  const gamma = createUtilityGamma(0.8); // 사회적 효용 가중치

  // 사용자 자산
  const userPmpAmount = createPmpAmount(500);
  const userPmcAmount = createPmcAmount(200);
  const donationUtility = 0.6; // 기부로 인한 사회적 효용

  // 효용함수: U(x) = α·ln(PmpAmount) + β·ln(PmcAmount) + γ·S(Donate)
  const individualUtility = calculateIndividualUtility(
    userPmpAmount,
    userPmcAmount,
    donationUtility,
    alpha,
    beta,
    gamma
  );

  console.log(`Alpha (PmpAmount marginal utility): ${alpha}`);
  console.log(`Beta (PmcAmount marginal utility): ${beta}`);
  console.log(`Gamma (social utility weight): ${gamma}`);
  console.log(`User PmpAmount: ${userPmpAmount}`);
  console.log(`User PmcAmount: ${userPmcAmount}`);
  console.log(`Donation Utility: ${donationUtility}`);
  console.log(`Individual Utility: ${individualUtility.toFixed(4)}`);
}

/**
 * 예제 7: 사회 불평등 측정 (Gini Coefficient)
 */
export function exampleSocialWelfare() {
  console.log("=== 사회후생 및 불평등 예제 ===");

  // 지니 계수 (0: 완전평등, 1: 완전불평등)
  const giniCoeff = createGiniCoefficient(0.25); // 상당히 평등한 분배
  console.log(`Gini Coefficient: ${giniCoeff}`);

  const inequalityLevel =
    giniCoeff < 0.25
      ? "Low inequality"
      : giniCoeff < 0.4
        ? "Moderate inequality"
        : giniCoeff < 0.6
          ? "High inequality"
          : "Very high inequality";

  console.log(`Inequality Level: ${inequalityLevel}`);
}

/**
 * 모든 예제 실행
 */
export function runAllExamples() {
  console.log("🚀 Economic Value Objects Examples\n");

  try {
    exampleBasicCurrency();
    console.log("");

    exampleAgencyTheory();
    console.log("");

    exampleCAPM();
    console.log("");

    exampleBehavioralEconomics();
    console.log("");

    exampleNetworkEconomics();
    console.log("");

    exampleUtilityFunction();
    console.log("");

    exampleSocialWelfare();
    console.log("");

    console.log("✅ All examples completed successfully!");
  } catch (error) {
    console.error("❌ Error in examples:", error);
  }
}

// 개발 중 테스트를 위한 즉시 실행
if (typeof window === "undefined") {
  // Node.js 환경에서만
  // runAllExamples();
}
