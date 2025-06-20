/**
 * Economic Value Objects Constructors and Utilities
 * 경제 값 객체들의 생성자 및 유틸리티 함수들
 *
 * 모든 함수는 도메인 규칙과 제약조건을 검증합니다.
 */

import {
  ActiveUserCount,
  AgencyCostReduction,
  AgentAlignmentRatio,
  BetaCoefficient,
  BudgetTransparencyScore,
  CitizenParticipationRate,
  DemocraticLegitimacyScore,
  EBIT,
  EffectSize,
  EndowmentAttachment,
  ExpectedReturn,
  GiniCoefficient,
  IndividualUtility,
  // Agency Theory
  InformationAsymmetryScore,
  // 공공선택이론
  IronTriangleScore,
  LearningRate,
  // Behavioral Economics
  LossAversionCoefficient,
  MarginalPropensityToConsume,
  MarketRiskPremium,
  MentalAccountBalance,
  MetcalfeValue,
  MoneyWaveAmount,
  MoneyWaveId,
  MoneyWaveType,
  // 거시경제
  MultiplierEffect,
  // Network Economics
  NetworkDensity,
  PMC,
  // 핵심 화폐 시스템
  PMP,
  // 예측 정확도
  PredictionAccuracy,
  ProspectValue,
  PValue,
  ReedValue,
  // CAPM
  RiskFreeRate,
  RiskTolerance,
  RSquared,
  TaxRate,
  // 효용함수
  UtilityAlpha,
  UtilityBeta,
  UtilityGamma,
} from "./economic-types";

// ===== 핵심 화폐 시스템 생성자 =====

/**
 * PMP 생성 (위험프리 자산)
 * @param value - PMP 값 (0 이상)
 */
export const createPMP = (value: number): PMP => {
  if (value < 0) {
    throw new Error("PMP cannot be negative");
  }
  if (!Number.isInteger(value)) {
    throw new Error("PMP must be an integer");
  }
  return value as PMP;
};

/**
 * PMC 생성 (위험자산)
 * @param value - PMC 값 (0 이상)
 */
export const createPMC = (value: number): PMC => {
  if (value < 0) {
    throw new Error("PMC cannot be negative");
  }
  if (!Number.isFinite(value)) {
    throw new Error("PMC must be a finite number");
  }
  return value as PMC;
};

/**
 * EBIT 생성
 * @param value - EBIT 값 (음수 가능)
 */
export const createEBIT = (value: number): EBIT => {
  if (!Number.isFinite(value)) {
    throw new Error("EBIT must be a finite number");
  }
  return value as EBIT;
};

/**
 * MoneyWave ID 생성
 * @param type - MoneyWave 타입
 * @param timestamp - 타임스탬프
 */
export const createMoneyWaveId = (
  type: MoneyWaveType,
  timestamp: Date
): MoneyWaveId => {
  const id = `${type}_${timestamp.getTime()}`;
  return id as MoneyWaveId;
};

/**
 * MoneyWave 금액 생성
 * @param value - 금액 (0 이상)
 */
export const createMoneyWaveAmount = (value: number): MoneyWaveAmount => {
  if (value < 0) {
    throw new Error("MoneyWave amount cannot be negative");
  }
  if (!Number.isFinite(value)) {
    throw new Error("MoneyWave amount must be finite");
  }
  return value as MoneyWaveAmount;
};

// ===== Agency Theory 생성자 =====

/**
 * 정보 비대칭 점수 생성 (0-1)
 * @param value - 비대칭 정도 (0: 완전 대칭, 1: 완전 비대칭)
 */
export const createInformationAsymmetryScore = (
  value: number
): InformationAsymmetryScore => {
  if (value < 0 || value > 1) {
    throw new Error("Information asymmetry score must be between 0 and 1");
  }
  return value as InformationAsymmetryScore;
};

/**
 * Agent 정렬 비율 생성 (0-1)
 * @param value - 정렬 정도 (0: 완전 불일치, 1: 완전 일치)
 */
export const createAgentAlignmentRatio = (
  value: number
): AgentAlignmentRatio => {
  if (value < 0 || value > 1) {
    throw new Error("Agent alignment ratio must be between 0 and 1");
  }
  return value as AgentAlignmentRatio;
};

/**
 * Agency Cost 감소율 생성 (0-1)
 * @param value - 감소율 (0: 변화 없음, 1: 완전 제거)
 */
export const createAgencyCostReduction = (
  value: number
): AgencyCostReduction => {
  if (value < 0 || value > 1) {
    throw new Error("Agency cost reduction must be between 0 and 1");
  }
  return value as AgencyCostReduction;
};

// ===== CAPM 생성자 =====

/**
 * 위험프리 수익률 생성
 * @param value - 연수익률 (예: 0.02 = 2%)
 */
export const createRiskFreeRate = (value: number): RiskFreeRate => {
  if (value < 0) {
    throw new Error("Risk-free rate cannot be negative");
  }
  if (value > 1) {
    throw new Error("Risk-free rate seems to high (>100%)");
  }
  return value as RiskFreeRate;
};

/**
 * 시장 위험 프리미엄 생성
 * @param value - 위험 프리미엄
 */
export const createMarketRiskPremium = (value: number): MarketRiskPremium => {
  if (!Number.isFinite(value)) {
    throw new Error("Market risk premium must be finite");
  }
  return value as MarketRiskPremium;
};

/**
 * 베타 계수 생성
 * @param value - 베타 값 (0 이상)
 */
export const createBetaCoefficient = (value: number): BetaCoefficient => {
  if (value < 0) {
    throw new Error("Beta coefficient cannot be negative");
  }
  if (!Number.isFinite(value)) {
    throw new Error("Beta coefficient must be finite");
  }
  return value as BetaCoefficient;
};

/**
 * 기대 수익률 생성
 * @param value - 기대 수익률
 */
export const createExpectedReturn = (value: number): ExpectedReturn => {
  if (!Number.isFinite(value)) {
    throw new Error("Expected return must be finite");
  }
  return value as ExpectedReturn;
};

/**
 * 위험 회피도 생성 (0-1)
 * @param value - 위험 회피도 (0: 위험 추구, 1: 극도 회피)
 */
export const createRiskTolerance = (value: number): RiskTolerance => {
  if (value < 0 || value > 1) {
    throw new Error("Risk tolerance must be between 0 and 1");
  }
  return value as RiskTolerance;
};

// ===== 공공선택이론 생성자 =====

/**
 * Iron Triangle 점수 생성 (0-1)
 * @param value - 담합 정도 (0: 담합 없음, 1: 완전 담합)
 */
export const createIronTriangleScore = (value: number): IronTriangleScore => {
  if (value < 0 || value > 1) {
    throw new Error("Iron Triangle score must be between 0 and 1");
  }
  return value as IronTriangleScore;
};

/**
 * 시민 참여율 생성 (0-1)
 * @param value - 참여율
 */
export const createCitizenParticipationRate = (
  value: number
): CitizenParticipationRate => {
  if (value < 0 || value > 1) {
    throw new Error("Citizen participation rate must be between 0 and 1");
  }
  return value as CitizenParticipationRate;
};

/**
 * 예산 투명성 점수 생성 (0-1)
 * @param value - 투명성 정도
 */
export const createBudgetTransparencyScore = (
  value: number
): BudgetTransparencyScore => {
  if (value < 0 || value > 1) {
    throw new Error("Budget transparency score must be between 0 and 1");
  }
  return value as BudgetTransparencyScore;
};

/**
 * 민주적 정당성 점수 생성 (0-1)
 * @param value - 정당성 정도
 */
export const createDemocraticLegitimacyScore = (
  value: number
): DemocraticLegitimacyScore => {
  if (value < 0 || value > 1) {
    throw new Error("Democratic legitimacy score must be between 0 and 1");
  }
  return value as DemocraticLegitimacyScore;
};

// ===== Behavioral Economics 생성자 =====

/**
 * 손실 회피 계수 생성 (Kahneman-Tversky 기본값: 2.25)
 * @param value - 손실 회피 계수 (1 이상)
 */
export const createLossAversionCoefficient = (
  value: number = 2.25
): LossAversionCoefficient => {
  if (value < 1) {
    throw new Error("Loss aversion coefficient must be at least 1");
  }
  if (value > 10) {
    throw new Error("Loss aversion coefficient seems too high (>10)");
  }
  return value as LossAversionCoefficient;
};

/**
 * Prospect Value 생성
 * @param value - 전망 가치
 */
export const createProspectValue = (value: number): ProspectValue => {
  if (!Number.isFinite(value)) {
    throw new Error("Prospect value must be finite");
  }
  return value as ProspectValue;
};

/**
 * Endowment Attachment 생성 (0-1)
 * @param value - 보유 효과 강도
 */
export const createEndowmentAttachment = (
  value: number
): EndowmentAttachment => {
  if (value < 0 || value > 1) {
    throw new Error("Endowment attachment must be between 0 and 1");
  }
  return value as EndowmentAttachment;
};

/**
 * Mental Account 잔액 생성
 * @param value - 잔액 (0 이상)
 */
export const createMentalAccountBalance = (
  value: number
): MentalAccountBalance => {
  if (value < 0) {
    throw new Error("Mental account balance cannot be negative");
  }
  return value as MentalAccountBalance;
};

// ===== Network Economics 생성자 =====

/**
 * 네트워크 밀도 생성 (0-1)
 * @param value - 연결 밀도
 */
export const createNetworkDensity = (value: number): NetworkDensity => {
  if (value < 0 || value > 1) {
    throw new Error("Network density must be between 0 and 1");
  }
  return value as NetworkDensity;
};

/**
 * Metcalfe 가치 생성 (n²)
 * @param activeUsers - 활성 사용자 수
 * @param density - 네트워크 밀도
 */
export const createMetcalfeValue = (
  activeUsers: number,
  density: number
): MetcalfeValue => {
  if (activeUsers < 0) {
    throw new Error("Active users cannot be negative");
  }
  if (density < 0 || density > 1) {
    throw new Error("Network density must be between 0 and 1");
  }

  const baseValue = Math.pow(activeUsers, 2);
  const adjustedValue = baseValue * Math.sqrt(density);

  return adjustedValue as MetcalfeValue;
};

/**
 * Reed's Law 가치 생성 (2^n, 계산 효율성을 위해 제한)
 * @param participantCount - 참여자 수 (최대 20)
 */
export const createReedValue = (participantCount: number): ReedValue => {
  if (participantCount < 0) {
    throw new Error("Participant count cannot be negative");
  }

  const limitedCount = Math.min(participantCount, 20); // 계산 효율성
  const value = Math.pow(2, limitedCount);

  return value as ReedValue;
};

/**
 * 활성 사용자 수 생성
 * @param value - 사용자 수 (0 이상)
 */
export const createActiveUserCount = (value: number): ActiveUserCount => {
  if (value < 0) {
    throw new Error("Active user count cannot be negative");
  }
  if (!Number.isInteger(value)) {
    throw new Error("Active user count must be an integer");
  }
  return value as ActiveUserCount;
};

// ===== 효용함수 생성자 =====

/**
 * 효용함수 계수들 생성
 */
export const createUtilityAlpha = (value: number): UtilityAlpha => {
  if (value < 0) {
    throw new Error("Utility alpha cannot be negative");
  }
  return value as UtilityAlpha;
};

export const createUtilityBeta = (value: number): UtilityBeta => {
  if (value < 0) {
    throw new Error("Utility beta cannot be negative");
  }
  return value as UtilityBeta;
};

export const createUtilityGamma = (value: number): UtilityGamma => {
  if (value < 0) {
    throw new Error("Utility gamma cannot be negative");
  }
  return value as UtilityGamma;
};

/**
 * 개인 효용 계산
 * U(x) = α·ln(PMP) + β·ln(PMC) + γ·S(Donate)
 */
export const calculateIndividualUtility = (
  pmp: PMP,
  pmc: PMC,
  donationUtility: number,
  alpha: UtilityAlpha,
  beta: UtilityBeta,
  gamma: UtilityGamma
): IndividualUtility => {
  const pmpValue = (pmp as number) + 1; // ln(0) 방지
  const pmcValue = (pmc as number) + 1;

  const utility =
    (alpha as number) * Math.log(pmpValue) +
    (beta as number) * Math.log(pmcValue) +
    (gamma as number) * donationUtility;

  return utility as IndividualUtility;
};

/**
 * Gini 계수 생성 (0-1)
 * @param value - 불평등 정도 (0: 완전 평등, 1: 완전 불평등)
 */
export const createGiniCoefficient = (value: number): GiniCoefficient => {
  if (value < 0 || value > 1) {
    throw new Error("Gini coefficient must be between 0 and 1");
  }
  return value as GiniCoefficient;
};

// ===== Prediction Accuracy 생성자 =====

/**
 * PredictionAccuracy 생성 (0~1 사이)
 * @param value - 예측 정확도 (0~1)
 */
export const createPredictionAccuracy = (value: number): PredictionAccuracy => {
  if (value < 0 || value > 1) {
    throw new Error("PredictionAccuracy must be between 0 and 1");
  }
  if (!Number.isFinite(value)) {
    throw new Error("PredictionAccuracy must be a finite number");
  }
  return value as PredictionAccuracy;
};

/**
 * P-Value 생성 (0~1 사이)
 * @param value - 통계적 유의성 p-값
 */
export const createPValue = (value: number): PValue => {
  if (value < 0 || value > 1) {
    throw new Error("P-Value must be between 0 and 1");
  }
  return value as PValue;
};

/**
 * R-Squared 생성 (0~1 사이)
 * @param value - 결정계수
 */
export const createRSquared = (value: number): RSquared => {
  if (value < 0 || value > 1) {
    throw new Error("R-Squared must be between 0 and 1");
  }
  return value as RSquared;
};

/**
 * 학습률 생성 (0~1 사이)
 * @param value - 학습률
 */
export const createLearningRate = (value: number): LearningRate => {
  if (value < 0 || value > 1) {
    throw new Error("Learning rate must be between 0 and 1");
  }
  return value as LearningRate;
};

/**
 * 효과 크기 생성
 * @param value - Cohen's d 또는 기타 효과 크기
 */
export const createEffectSize = (value: number): EffectSize => {
  if (!Number.isFinite(value)) {
    throw new Error("Effect size must be a finite number");
  }
  return value as EffectSize;
};

// ===== 값 추출 유틸리티 =====

/**
 * 브랜드 타입에서 원시 값 추출
 */
export const unwrapPMP = (pmp: PMP): number => pmp as number;
export const unwrapPMC = (pmc: PMC): number => pmc as number;
export const unwrapEBIT = (ebit: EBIT): number => ebit as number;
export const unwrapMoneyWaveAmount = (amount: MoneyWaveAmount): number =>
  amount as number;

/**
 * PredictionAccuracy 값 추출
 */
export const unwrapPredictionAccuracy = (
  prediction: PredictionAccuracy
): number => {
  return prediction as number;
};

/**
 * P-Value 값 추출
 */
export const unwrapPValue = (pValue: PValue): number => {
  return pValue as number;
};

/**
 * R-Squared 값 추출
 */
export const unwrapRSquared = (rSquared: RSquared): number => {
  return rSquared as number;
};

/**
 * ExpectedReturn 값 추출
 */
export const unwrapExpectedReturn = (
  expectedReturn: ExpectedReturn
): number => {
  return expectedReturn as number;
};

// 기타 unwrap 함수들...
export const unwrapRiskFreeRate = (rate: RiskFreeRate): number =>
  rate as number;
export const unwrapBetaCoefficient = (beta: BetaCoefficient): number =>
  beta as number;
export const unwrapNetworkDensity = (density: NetworkDensity): number =>
  density as number;
export const unwrapMetcalfeValue = (value: MetcalfeValue): number =>
  value as number;
export const unwrapUtilityAlpha = (alpha: UtilityAlpha): number =>
  alpha as number;
export const unwrapUtilityBeta = (beta: UtilityBeta): number => beta as number;
export const unwrapUtilityGamma = (gamma: UtilityGamma): number =>
  gamma as number;

// ===== 유효성 검증 유틸리티 =====

/**
 * 비율/점수 범위 검증 (0-1)
 */
export const isValidRatio = (value: number): boolean => {
  return value >= 0 && value <= 1 && Number.isFinite(value);
};

/**
 * 양수 검증
 */
export const isValidPositive = (value: number): boolean => {
  return value >= 0 && Number.isFinite(value);
};

/**
 * 정수 검증
 */
export const isValidInteger = (value: number): boolean => {
  return Number.isInteger(value) && value >= 0;
};

/**
 * CAPM 공식 계산
 * E[R] = Rf + β(Rm - Rf)
 */
export const calculateCAPMReturn = (
  riskFreeRate: RiskFreeRate,
  beta: BetaCoefficient,
  marketRiskPremium: MarketRiskPremium
): ExpectedReturn => {
  const expectedReturn =
    (riskFreeRate as number) + (beta as number) * (marketRiskPremium as number);
  return expectedReturn as ExpectedReturn;
};

/**
 * 거시경제 승수 계산
 * Multiplier = 1 / (1 - MPC × (1 - t))
 */
export const calculateMultiplierEffect = (
  mpc: MarginalPropensityToConsume,
  taxRate: TaxRate
): MultiplierEffect => {
  const multiplier = 1 / (1 - (mpc as number) * (1 - (taxRate as number)));
  if (!Number.isFinite(multiplier) || multiplier < 1) {
    throw new Error("Invalid multiplier calculation");
  }
  return multiplier as MultiplierEffect;
};
