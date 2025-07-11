/**
 * Economy Domain Value Objects - Index
 * 경제 도메인의 모든 값 객체, 타입, 생성자, 유틸리티 함수들을 export
 */

// 핵심 타입들
export * from "./economic-types";

// 생성자 및 유틸리티 함수들
export * from "./economic-value-objects";

// 재료 타입들 (다른 도메인과의 인터페이스용)
export type {
  ActiveUserCount,
  AgencyCostReduction,
  AgentAlignmentRatio,
  BetaCoefficient,
  BubbleRiskIndex,
  CircuitBreakerThreshold,
  CrossNetworkMultiplier,
  EBIT,
  EffectSize,
  EndowmentAttachment,
  ExpectedReturn,
  GiniCoefficient,
  IndividualUtility,
  InflationRiskScore,
  // Agency Theory
  InformationAsymmetryScore,
  LearningRate,
  // 리스크 관리
  LiquidityRiskScore,
  // Behavioral Economics
  LossAversionCoefficient,
  MarketRiskPremium,
  MentalAccountBalance,
  MetcalfeValue,
  MoneyWaveAmount,
  MoneyWaveId,
  // Network Economics
  NetworkDensity,
  PmcAmount,
  // 핵심 화폐
  PmpAmount,
  PredictionAccuracy,
  ProspectValue,
  PValue,
  ReedValue,
  // CAPM
  RiskFreeRate,
  RiskTolerance,
  // 실증분석
  RSquared,
  SocialWelfare,
  // 효용함수
  UtilityAlpha,
  UtilityBeta,
  UtilityGamma,
} from "./economic-types";

// 주요 생성자 함수들
export {
  // 경제학 공식들
  calculateCAPMReturn,
  calculateIndividualUtility,
  calculateMultiplierEffect,
  // 기타 생성자
  createActiveUserCount,
  createAgencyCostReduction,
  createAgentAlignmentRatio,
  // CAPM 생성자
  createBetaCoefficient,
  createEBIT,
  createEffectSize,
  createEndowmentAttachment,
  createExpectedReturn,
  createGiniCoefficient,
  // Agency Theory 생성자
  createInformationAsymmetryScore,
  createLearningRate,
  // Behavioral Economics 생성자
  createLossAversionCoefficient,
  createMarketRiskPremium,
  createMentalAccountBalance,
  createMetcalfeValue,
  createMoneyWaveAmount,
  createMoneyWaveId,
  // Network Economics 생성자
  createNetworkDensity,
  createPmcAmount,
  // 핵심 화폐 생성자
  createPmpAmount,
  // 실증분석 생성자
  createPredictionAccuracy,
  createProspectValue,
  createPValue,
  createReedValue,
  createRiskFreeRate,
  createRiskTolerance,
  createRSquared,
  // 효용함수 생성자
  createUtilityAlpha,
  createUtilityBeta,
  createUtilityGamma, // 유효성 검증
  isValidInteger,
  isValidPositive,
  isValidRatio,
  unwrapBetaCoefficient,
  unwrapEBIT,
  unwrapExpectedReturn,
  unwrapMetcalfeValue,
  unwrapMoneyWaveAmount,
  unwrapNetworkDensity,
  unwrapPmcAmount,
  // 값 추출 함수들
  unwrapPmpAmount,
  // 실증분석 추출 함수들
  unwrapPredictionAccuracy,
  unwrapPValue,
  unwrapRiskFreeRate,
  unwrapRSquared,
  unwrapUtilityAlpha,
  unwrapUtilityBeta,
  unwrapUtilityGamma,
} from "./economic-value-objects";

// 열거형들
export { MentalAccountType, MoneyWaveType } from "./economic-types";
