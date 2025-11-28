/**
 * Economy Domain Value Objects
 * Project_Economic.md의 경제학 이론을 바탕으로 한 핵심 경제 값 객체들
 *
 * 포함된 경제학 이론:
 * - Jensen & Meckling Agency Theory
 * - CAPM (Capital Asset Pricing Model)
 * - Buchanan Public Choice Theory
 * - Kahneman-Tversky Prospect Theory
 * - Metcalfe's Law Network Economics
 */

declare const __economicBrand: unique symbol;

/**
 * 경제 브랜드 타입 생성 유틸리티
 */
export type EconomicBrand<T, TBrand> = T & { [__economicBrand]: TBrand };

// ===== 핵심 화폐 시스템 =====

/**
 * PmpAmount (Positive Multiplier Point)
 * - 위험프리 자산 (Risk-Free Asset)
 * - CAPM의 무위험수익률 역할
 * - 사용자 활동을 통해 획득
 */
export type PmpAmount = EconomicBrand<number, "PmpAmount">;

/**
 * PmcAmount (Positive Multiplier Coin)
 * - 위험자산 (Risky Asset)
 * - EBIT 기반 발행, 위험프리미엄 반영
 * - 기부 전용 사용
 */
export type PmcAmount = EconomicBrand<number, "PmcAmount">;

/**
 * EBIT (Earnings Before Interest and Tax)
 * - PosMul 3LC의 세전영업이익
 * - PmcAmount 발행량 결정 기준
 */
export type EBIT = EconomicBrand<number, "EBIT">;

/**
 * MoneyWave 식별자
 * - MoneyWave1/2/3 메커니즘 구분
 */
export type MoneyWaveId = EconomicBrand<string, "MoneyWaveId">;

/**
 * MoneyWave 타입
 */
export enum MoneyWaveType {
  WAVE1 = "EBIT_BASED_EMISSION", // EBIT 기반 PmcAmount 발행
  WAVE2 = "UNUSED_PmcAmount_REDISTRIBUTION", // 미사용 PmcAmount 재분배
  WAVE3 = "ENTREPRENEUR_ECOSYSTEM", // 기업가 생태계
}

/**
 * MoneyWave 금액
 */
export type MoneyWaveAmount = EconomicBrand<number, "MoneyWaveAmount">;

// ===== Agency Theory 관련 =====

/**
 * 정보 비대칭 점수 (0-1, 높을수록 비대칭 심각)
 * Jensen & Meckling Agency Theory
 */
export type InformationAsymmetryScore = EconomicBrand<
  number,
  "InformationAsymmetryScore"
>;

/**
 * Agent 정렬 비율 (0-1, 높을수록 Principal과 일치)
 */
export type AgentAlignmentRatio = EconomicBrand<number, "AgentAlignmentRatio">;

/**
 * Agency Cost 감소율 (0-1, 높을수록 개선)
 */
export type AgencyCostReduction = EconomicBrand<number, "AgencyCostReduction">;

// ===== CAPM 관련 =====

/**
 * 위험프리 수익률 (연율)
 */
export type RiskFreeRate = EconomicBrand<number, "RiskFreeRate">;

/**
 * 시장 위험 프리미엄
 */
export type MarketRiskPremium = EconomicBrand<number, "MarketRiskPremium">;

/**
 * 베타 계수 (시장 대비 위험도)
 */
export type BetaCoefficient = EconomicBrand<number, "BetaCoefficient">;

/**
 * 기대 수익률
 */
export type ExpectedReturn = EconomicBrand<number, "ExpectedReturn">;

/**
 * 위험 회피도 (0-1)
 */
export type RiskTolerance = EconomicBrand<number, "RiskTolerance">;

// ===== 공공선택이론 관련 =====

/**
 * Iron Triangle 점수 (0-1, 높을수록 담합 심각)
 */
export type IronTriangleScore = EconomicBrand<number, "IronTriangleScore">;

/**
 * 시민 참여율 (0-1)
 */
export type CitizenParticipationRate = EconomicBrand<
  number,
  "CitizenParticipationRate"
>;

/**
 * 예산 투명성 점수 (0-1)
 */
export type BudgetTransparencyScore = EconomicBrand<
  number,
  "BudgetTransparencyScore"
>;

/**
 * 민주적 정당성 점수 (0-1)
 */
export type DemocraticLegitimacyScore = EconomicBrand<
  number,
  "DemocraticLegitimacyScore"
>;

// ===== Behavioral Economics 관련 =====

/**
 * 손실 회피 계수 (Kahneman-Tversky: λ = 2.25)
 */
export type LossAversionCoefficient = EconomicBrand<
  number,
  "LossAversionCoefficient"
>;

/**
 * Prospect Value (전망 가치)
 */
export type ProspectValue = EconomicBrand<number, "ProspectValue">;

/**
 * Endowment Attachment (보유 효과 강도, 0-1)
 */
export type EndowmentAttachment = EconomicBrand<number, "EndowmentAttachment">;

/**
 * Mental Account 타입
 */
export enum MentalAccountType {
  INVESTMENT_PmpAmount = "investment_pmp",
  PREDICTION_PmpAmount = "prediction_pmp",
  SOCIAL_PmcAmount = "social_pmc",
  DONATION_PmcAmount = "donation_pmc",
}

/**
 * Mental Account 잔액
 */
export type MentalAccountBalance = EconomicBrand<
  number,
  "MentalAccountBalance"
>;

// ===== Network Economics 관련 =====

/**
 * 네트워크 밀도 (0-1)
 */
export type NetworkDensity = EconomicBrand<number, "NetworkDensity">;

/**
 * Metcalfe 가치 (n²)
 */
export type MetcalfeValue = EconomicBrand<number, "MetcalfeValue">;

/**
 * Reed's Law 가치 (2^n)
 */
export type ReedValue = EconomicBrand<number, "ReedValue">;

/**
 * Cross-Network Effect 승수
 */
export type CrossNetworkMultiplier = EconomicBrand<
  number,
  "CrossNetworkMultiplier"
>;

/**
 * 활성 사용자 수
 */
export type ActiveUserCount = EconomicBrand<number, "ActiveUserCount">;

// ===== 효용함수 관련 =====

/**
 * 개인 효용함수 계수 α (PmpAmount에 대한 한계효용)
 */
export type UtilityAlpha = EconomicBrand<number, "UtilityAlpha">;

/**
 * 개인 효용함수 계수 β (PmcAmount에 대한 한계효용)
 */
export type UtilityBeta = EconomicBrand<number, "UtilityBeta">;

/**
 * 개인 효용함수 계수 γ (사회적 효용 가중치)
 */
export type UtilityGamma = EconomicBrand<number, "UtilityGamma">;

/**
 * 개인 효용 값
 */
export type IndividualUtility = EconomicBrand<number, "IndividualUtility">;

/**
 * 사회후생 값
 */
export type SocialWelfare = EconomicBrand<number, "SocialWelfare">;

/**
 * 지니 계수 (0-1, 불평등 측정)
 */
export type GiniCoefficient = EconomicBrand<number, "GiniCoefficient">;

// ===== 거시경제 관련 =====

/**
 * 승수 효과 (Multiplier Effect)
 */
export type MultiplierEffect = EconomicBrand<number, "MultiplierEffect">;

/**
 * 한계소비성향 (MPC, 0-1)
 */
export type MarginalPropensityToConsume = EconomicBrand<
  number,
  "MarginalPropensityToConsume"
>;

/**
 * 세율 (Tax Rate, 0-1)
 */
export type TaxRate = EconomicBrand<number, "TaxRate">;

// ===== 실증분석 관련 =====

/**
 * R-squared (결정계수, 0-1)
 */
export type RSquared = EconomicBrand<number, "RSquared">;

/**
 * P-value (유의확률, 0-1)
 */
export type PValue = EconomicBrand<number, "PValue">;

/**
 * Effect Size (효과 크기)
 */
export type EffectSize = EconomicBrand<number, "EffectSize">;

/**
 * 학습률 (Learning Rate, 0-1)
 */
export type LearningRate = EconomicBrand<number, "LearningRate">;

/**
 * 예측 정확도 (Prediction Accuracy, 0-1)
 */
export type PredictionAccuracy = EconomicBrand<number, "PredictionAccuracy">;

// ===== 리스크 관리 관련 =====

/**
 * 유동성 위험 점수 (0-1)
 */
export type LiquidityRiskScore = EconomicBrand<number, "LiquidityRiskScore">;

/**
 * 인플레이션 위험 점수 (0-1)
 */
export type InflationRiskScore = EconomicBrand<number, "InflationRiskScore">;

/**
 * 버블 위험 지수 (Shiller 지표 기반)
 */
export type BubbleRiskIndex = EconomicBrand<number, "BubbleRiskIndex">;

/**
 * Circuit Breaker 임계값
 */
export type CircuitBreakerThreshold = EconomicBrand<
  number,
  "CircuitBreakerThreshold"
>;

// ===== 시간 관련 =====

/**
 * MoneyWave 발생 주기 (일 단위)
 */
export type MoneyWaveCycle = EconomicBrand<number, "MoneyWaveCycle">;

/**
 * PmcAmount 만료 기간 (일 단위)
 */
export type PmcAmountExpirationPeriod = EconomicBrand<
  number,
  "PmcAmountExpirationPeriod"
>;

/**
 * 학습 곡선 기간 (주 단위)
 */
export type LearningCurvePeriod = EconomicBrand<number, "LearningCurvePeriod">;
