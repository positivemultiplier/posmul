/**
 * 경제 시스템 핵심 타입 정의
 * Jensen & Meckling Agency Theory 및 CAPM 모델 기반
 */

import type {
  AccuracyScore,
  InformationTransparency,
  PMC,
  PMP,
  RiskAversionCoefficient,
  SocialLearningIndex,
} from "./branded-types";

/**
 * 게임 상태
 */
export enum GameStatus {
  PENDING = "PENDING", // 시작 전
  ACTIVE = "ACTIVE", // 진행 중
  PREDICTING = "PREDICTING", // 예측 접수 중
  EVALUATING = "EVALUATING", // 결과 평가 중
  COMPLETED = "COMPLETED", // 완료
  CANCELLED = "CANCELLED", // 취소
}

/**
 * 예측 결과 상태
 */
export enum PredictionResult {
  PENDING = "PENDING", // 결과 대기
  CORRECT = "CORRECT", // 정답
  INCORRECT = "INCORRECT", // 오답
  PARTIALLY_CORRECT = "PARTIALLY_CORRECT", // 부분 정답
}

/**
 * MoneyWave 타입 (3단계 경제 순환)
 */
export enum MoneyWaveType {
  WAVE1 = "WAVE1", // EBIT 기반 PMC 발행
  WAVE2 = "WAVE2", // 미사용 PMC 재분배
  WAVE3 = "WAVE3", // 기업가 생태계
}

/**
 * 투자 리그 타입
 */
export enum LeagueType {
  MAJOR = "MAJOR", // Major League (광고 시청)
  LOCAL = "LOCAL", // Local League (지역 소비)
  CLOUD = "CLOUD", // Cloud Funding (크라우드 펀딩)
}

/**
 * CAPM 위험-수익 구조
 */
export interface CAPMParameters {
  riskFreeRate: number; // 무위험 수익률 (PMP 기본 수익률)
  marketRiskPremium: number; // 시장 위험프리미엄
  beta: number; // 베타 (시장 대비 위험도)
  expectedEBIT: number; // 예상 EBIT
}

/**
 * Agency Cost 계산 파라미터
 */
export interface AgencyCostParams {
  predictionAccuracy: AccuracyScore; // 예측 정확도
  socialLearningIndex: SocialLearningIndex; // 사회적 학습 지수
  informationTransparency: InformationTransparency; // 정보 투명성
}

/**
 * PMP-PMC 전환 결과
 */
export interface ConversionResult {
  conversionRate: number; // 전환율 (0-1)
  agencyCostReduction: number; // Agency Cost 감소율
  incentiveAlignment: number; // 인센티브 정렬도
  socialWelfareGain: number; // 사회후생 증가
}

/**
 * 사용자 포트폴리오
 */
export interface UserPortfolio {
  userId: string;
  pmpBalance: PMP; // PMP 잔액
  pmcBalance: PMC; // PMC 잔액
  riskTolerance: RiskAversionCoefficient; // 위험 성향
  totalUtility: number; // 총 효용
  socialContribution: number; // 사회적 기여도
}

/**
 * 효용함수 계수
 * U(x) = α·ln(PMP) + β·ln(PMC) + γ·S(Donate)
 */
export interface UtilityFunctionCoefficients {
  alpha: number; // PMP에 대한 한계효용
  beta: number; // PMC에 대한 한계효용
  gamma: number; // 사회적 효용에 대한 가중치
}

/**
 * 사회후생함수 파라미터
 */
export interface SocialWelfareParams {
  individualUtilities: number[]; // 개인 효용들
  giniCoefficient: number; // 지니계수 (분배 형평성)
  equityWeight: number; // 형평성 가중치 (λ)
}

/**
 * 네트워크 효과 측정
 */
export interface NetworkEffectMetrics {
  activeUsers: number; // 활성 사용자 수
  connectionDensity: number; // 연결 밀도
  metcalfeValue: number; // Metcalfe's Law 가치
  reedValue: number; // Reed's Law 가치 (부분집합)
  crossNetworkEffect: number; // 교차 네트워크 효과
}

/**
 * 예측 시장 데이터
 */
export interface PredictionMarketData {
  totalParticipants: number; // 총 참여자 수
  totalPMPStaked: PMP; // 총 투입 PMP
  averageConfidence: number; // 평균 확신도
  consensusAccuracy: number; // 합의 정확도
  informationAggregation: number; // 정보 집계 효율성
}

/**
 * Agency Cost 최적화 관련 타입들
 */
export interface OptimizationConfig {
  maxIterations?: number;
  convergenceThreshold?: number;
  maxIncentiveReward?: number;
  maxIncentiveCost?: number;
  optimizationMethod?: "monte_carlo" | "genetic_algorithm" | "gradient_descent";
}

export interface SocialWelfareMetrics {
  totalSocialWelfare: number;
  averageWelfare: number;
  efficiencyIndex: number;
  equityIndex: number;
  agencyCostIndex: number;
  paretoEfficiency: number;
  recommendations: string[];
}

export interface EfficiencyAnalysis {
  paretoEfficiency: number;
  allocativeEfficiency: number;
  technicalEfficiency: number;
  dynamicEfficiency: number;
  overallEfficiency: number;
  bottlenecks: string[];
  improvementPotential: number;
}

export interface IncentiveStructure {
  type: string;
  reward: number;
  cost: number;
  effectiveness: number;
  conditions: string[];
}

/**
 * Jensen & Meckling Agency Theory 관련 타입들
 */
export interface AgencyCostProfile {
  monitoringCost: number;
  bondingCost: number;
  residualLoss: number;
  totalAgencyCost: number;
  costEfficiency: number;
}

/**
 * Principal-Agent 관계 상세 정의
 */
export interface PrincipalAgentRelationship {
  principalId: string;
  agentId: string;
  relationshipType:
    | "citizen_bureaucrat"
    | "citizen_politician"
    | "investor_manager";

  // Agency Theory 핵심 지표들
  informationAsymmetryLevel: number; // 0-1, 정보 비대칭 수준
  goalAlignment: number; // 0-1, 목표 정렬도
  trustLevel: number; // 0-1, 신뢰 수준
  monitoringDifficulty: number; // 0-1, 모니터링 난이도
  principalKnowledge: number; // 0-1, Principal의 전문 지식
  communicationEfficiency: number; // 0-1, 의사소통 효율성
  decisionMakingSpeed: number; // 0-1, 의사결정 속도
  expectedOutcome: number; // 기대 성과
  currentIncentives?: IncentiveStructure[];
}

/**
 * 정보 비대칭 해결 방안
 */
export interface InformationAsymmetryResolution {
  transparencyLevel: InformationTransparency;
  disclosureRequirements: string[];
  monitoringMechanisms: string[];
  verificationProcesses: string[];
  socialLearningEffect: SocialLearningIndex;
}

/**
 * 역선택 문제 해결 방안
 */
export interface AdverseSelectionSolution {
  screening: {
    criteria: string[];
    process: string[];
    effectiveness: number;
  };
  signaling: {
    signals: string[];
    credibility: number;
    cost: number;
  };
  selfSelection: {
    mechanisms: string[];
    participation: number;
  };
}

/**
 * 도덕적 해이 방지 메커니즘
 */
export interface MoralHazardPrevention {
  monitoring: {
    frequency: "real_time" | "daily" | "weekly" | "monthly";
    methods: string[];
    coverage: number;
  };
  incentives: {
    structure: IncentiveStructure[];
    alignment: number;
    effectiveness: number;
  };
  penalties: {
    types: string[];
    severity: number;
    deterrentEffect: number;
  };
}

/**
 * Agency Cost 최적화 목표 설정
 */
export interface OptimizationTarget {
  minimizeAgencyCost: boolean;
  maximizeSocialWelfare: boolean;
  enhanceEfficiency: boolean;
  improveTrustLevel: boolean;
}

/**
 * 에러 타입들
 */
export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly field: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class InsufficientBalanceError extends DomainError {
  constructor(requested: number, available: number) {
    super(
      `Insufficient balance: requested ${requested}, available ${available}`,
      "INSUFFICIENT_BALANCE"
    );
    this.name = "InsufficientBalanceError";
  }
}

export class InvalidConversionError extends DomainError {
  constructor(reason: string) {
    super(`Invalid conversion: ${reason}`, "INVALID_CONVERSION");
    this.name = "InvalidConversionError";
  }
}

/**
 * Result 패턴
 */
export type Result<T, E = DomainError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Result 헬퍼 함수들
 */
export const success = <T>(data: T): Result<T> => ({ success: true, data });
export const failure = <E extends DomainError>(error: E): Result<never, E> => ({
  success: false,
  error,
});

/**
 * 이벤트 기본 인터페이스
 */
export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
}

/**
 * 타임스탬프 인터페이스
 */
export interface Timestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
