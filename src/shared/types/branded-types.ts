/**
 * 브랜드 타입 정의
 * 타입 안전성을 위한 강타입 시스템 구현
 * Jensen & Meckling Agency Theory 기반 경제 모델 지원
 */

declare const __brand: unique symbol;

/**
 * 브랜드 타입 생성 유틸리티
 */
export type Brand<T, TBrand> = T & { [__brand]: TBrand };

/**
 * 사용자 식별자
 */
export type UserId = Brand<string, 'UserId'>;

/**
 * 예측 게임 식별자
 */
export type PredictionGameId = Brand<string, 'PredictionGameId'>;

/**
 * 예측 식별자  
 */
export type PredictionId = Brand<string, 'PredictionId'>;

/**
 * PMP (PosMul Point) - Risk-Free Asset
 * CAPM 모델에서 무위험 자산 역할
 */
export type PMP = Brand<number, 'PMP'>;

/**
 * PMC (PosMul Coin) - Risky Asset
 * EBIT 기반 발행, 위험프리미엄 반영
 */
export type PMC = Brand<number, 'PMC'>;

/**
 * 예측 정확도 (0-1 범위)
 */
export type AccuracyScore = Brand<number, 'AccuracyScore'>;

/**
 * 사회적 학습 지수 (0-1 범위)
 */
export type SocialLearningIndex = Brand<number, 'SocialLearningIndex'>;

/**
 * 정보 투명성 지수 (0-1 범위)
 */
export type InformationTransparency = Brand<number, 'InformationTransparency'>;

/**
 * Agency Cost 점수 (0-1 범위, 낮을수록 좋음)
 */
export type AgencyCostScore = Brand<number, 'AgencyCostScore'>;

/**
 * 위험 회피도 (0-1 범위)
 */
export type RiskAversionCoefficient = Brand<number, 'RiskAversionCoefficient'>;

/**
 * 브랜드 타입 생성자 함수들
 */
export const createUserId = (value: string): UserId => value as UserId;
export const createPredictionGameId = (value: string): PredictionGameId => value as PredictionGameId;
export const createPredictionId = (value: string): PredictionId => value as PredictionId;
export const createPMP = (value: number): PMP => {
  if (value < 0) throw new Error('PMP cannot be negative');
  return value as PMP;
};
export const createPMC = (value: number): PMC => {
  if (value < 0) throw new Error('PMC cannot be negative');
  return value as PMC;
};
export const createAccuracyScore = (value: number): AccuracyScore => {
  if (value < 0 || value > 1) throw new Error('AccuracyScore must be between 0 and 1');
  return value as AccuracyScore;
};
export const createSocialLearningIndex = (value: number): SocialLearningIndex => {
  if (value < 0 || value > 1) throw new Error('SocialLearningIndex must be between 0 and 1');
  return value as SocialLearningIndex;
};
export const createInformationTransparency = (value: number): InformationTransparency => {
  if (value < 0 || value > 1) throw new Error('InformationTransparency must be between 0 and 1');
  return value as InformationTransparency;
};
export const createAgencyCostScore = (value: number): AgencyCostScore => {
  if (value < 0 || value > 1) throw new Error('AgencyCostScore must be between 0 and 1');
  return value as AgencyCostScore;
};
export const createRiskAversionCoefficient = (value: number): RiskAversionCoefficient => {
  if (value < 0 || value > 1) throw new Error('RiskAversionCoefficient must be between 0 and 1');
  return value as RiskAversionCoefficient;
};

/**
 * 브랜드 타입 값 추출 함수들
 */
export const unwrapPMP = (pmp: PMP): number => pmp as number;
export const unwrapPMC = (pmc: PMC): number => pmc as number;
export const unwrapAccuracyScore = (score: AccuracyScore): number => score as number;
export const unwrapSocialLearningIndex = (index: SocialLearningIndex): number => index as number;
export const unwrapInformationTransparency = (transparency: InformationTransparency): number => transparency as number;
export const unwrapAgencyCostScore = (score: AgencyCostScore): number => score as number;
export const unwrapRiskAversionCoefficient = (coefficient: RiskAversionCoefficient): number => coefficient as number;
