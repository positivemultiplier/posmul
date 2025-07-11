/**
 * Risk Management Service Interfaces
 * 리스크 관리 서비스의 인터페이스 정의
 */

import { Result } from "@posmul/auth-economy-sdk";

import {
  EconomicSystemState,
  RiskAssessment,
  RiskMitigationAction,
  TaylorRuleResult,
} from "../risk-management.service";

/**
 * 리스크 관리 서비스 인터페이스
 */
export interface IRiskManagementService {
  /**
   * Taylor Rule을 활용한 통화정책 권고안 계산
   */
  calculateTaylorRule(
    systemState: EconomicSystemState
  ): Result<TaylorRuleResult>;

  /**
   * 종합적인 리스크 평가 수행
   */
  assessSystemRisk(systemState: EconomicSystemState): Result<RiskAssessment>;

  /**
   * Circuit Breaker 동작 여부 확인
   */
  checkCircuitBreaker(systemState: EconomicSystemState): boolean;

  /**
   * Mechanism Design Theory 기반 인센티브 최적화
   */
  optimizeIncentiveMechanism(
    systemState: EconomicSystemState,
    userBehaviorData: { participationRate: number; averageContribution: number }
  ): Result<{
    adjustedRewardRate: number;
    optimalFeeStructure: number;
    incentiveAlignment: number;
  }>;
}

/**
 * 리스크 모니터링 서비스 인터페이스
 */
export interface IRiskMonitoringService {
  /**
   * 실시간 리스크 모니터링 시작
   */
  startRiskMonitoring(intervalMs: number): void;

  /**
   * 리스크 모니터링 중단
   */
  stopRiskMonitoring(): void;

  /**
   * 리스크 알림 콜백 등록
   */
  onRiskAlert(callback: (assessment: RiskAssessment) => void): void;

  /**
   * Circuit Breaker 트리거 콜백 등록
   */
  onCircuitBreakerTriggered(
    callback: (systemState: EconomicSystemState) => void
  ): void;
}

/**
 * 시나리오 분석 서비스 인터페이스
 */
export interface IScenarioAnalysisService {
  /**
   * 스트레스 테스트 수행
   */
  runStressTest(
    baselineState: EconomicSystemState,
    stressScenarios: StressScenario[]
  ): Result<StressTestResult[]>;

  /**
   * 몬테카를로 시뮬레이션
   */
  runMonteCarloSimulation(
    baselineState: EconomicSystemState,
    simulationParams: MonteCarloParams
  ): Result<SimulationResult>;

  /**
   * 역사적 시나리오 재현
   */
  replayHistoricalScenario(
    scenarioId: string,
    currentState: EconomicSystemState
  ): Result<ScenarioReplayResult>;
}

/**
 * 스트레스 시나리오 정의
 */
export interface StressScenario {
  readonly name: string;
  readonly description: string;
  readonly severity: number; // 0-1 스케일
  readonly parameters: {
    readonly inflationShock?: number;
    readonly liquidityDrain?: number;
    readonly demandSurge?: number;
    readonly externalShock?: number;
  };
}

/**
 * 스트레스 테스트 결과
 */
export interface StressTestResult {
  readonly scenario: StressScenario;
  readonly resultingState: EconomicSystemState;
  readonly riskAssessment: RiskAssessment;
  readonly recommendedActions: RiskMitigationAction[];
  readonly recoveryTimeEstimate: number; // 일 단위
}

/**
 * 몬테카를로 시뮬레이션 파라미터
 */
export interface MonteCarloParams {
  readonly iterations: number;
  readonly timeHorizonDays: number;
  readonly volatilityFactors: {
    readonly inflation: number;
    readonly liquidity: number;
    readonly demand: number;
  };
  readonly correlationMatrix: number[][]; // 변수 간 상관관계
}

/**
 * 시뮬레이션 결과
 */
export interface SimulationResult {
  readonly valueAtRisk95: number; // 95% VaR
  readonly valueAtRisk99: number; // 99% VaR
  readonly expectedShortfall: number; // Expected Shortfall
  readonly confidenceIntervals: {
    readonly lower95: EconomicSystemState;
    readonly upper95: EconomicSystemState;
    readonly lower99: EconomicSystemState;
    readonly upper99: EconomicSystemState;
  };
  readonly probabilityOfCrisis: number; // 위기 발생 확률
}

/**
 * 역사적 시나리오 재현 결과
 */
export interface ScenarioReplayResult {
  readonly scenarioId: string;
  readonly originalOutcome: EconomicSystemState;
  readonly predictedOutcome: EconomicSystemState;
  readonly accuracy: number; // 0-1 스케일
  readonly lessons: string[];
  readonly applicableActions: RiskMitigationAction[];
}

/**
 * 정책 효과성 분석 서비스
 */
export interface IPolicyEffectivenessService {
  /**
   * 정책 시뮬레이션
   */
  simulatePolicy(
    policy: PolicyProposal,
    currentState: EconomicSystemState,
    timeHorizonDays: number
  ): Result<PolicySimulationResult>;

  /**
   * 정책 최적화
   */
  optimizePolicy(
    objectives: PolicyObjective[],
    constraints: PolicyConstraint[],
    currentState: EconomicSystemState
  ): Result<OptimalPolicyResult>;

  /**
   * 정책 효과 추적
   */
  trackPolicyImpact(
    policyId: string,
    implementationDate: Date,
    currentState: EconomicSystemState
  ): Result<PolicyImpactAnalysis>;
}

/**
 * 정책 제안
 */
export interface PolicyProposal {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: "MONETARY" | "FISCAL" | "REGULATORY" | "INCENTIVE";
  readonly parameters: Record<string, number>;
  readonly expectedDuration: number; // 일 단위
}

/**
 * 정책 목표
 */
export interface PolicyObjective {
  readonly metric: "INFLATION" | "LIQUIDITY" | "STABILITY" | "GROWTH";
  readonly target: number;
  readonly weight: number; // 중요도 가중치
  readonly tolerance: number; // 허용 편차
}

/**
 * 정책 제약조건
 */
export interface PolicyConstraint {
  readonly type:
    | "MAX_ISSUANCE"
    | "MIN_LIQUIDITY"
    | "MAX_VOLATILITY"
    | "BUDGET_LIMIT";
  readonly value: number;
  readonly hard: boolean; // true: 절대 제약, false: 소프트 제약
}

/**
 * 정책 시뮬레이션 결과
 */
export interface PolicySimulationResult {
  readonly policy: PolicyProposal;
  readonly trajectories: EconomicSystemState[];
  readonly achievedObjectives: { [metric: string]: number };
  readonly sideEffects: string[];
  readonly overallScore: number; // 0-1 스케일
}

/**
 * 최적 정책 결과
 */
export interface OptimalPolicyResult {
  readonly optimizedPolicy: PolicyProposal;
  readonly expectedOutcome: EconomicSystemState;
  readonly objectiveScores: { [metric: string]: number };
  readonly tradeoffs: string[];
  readonly robustness: number; // 0-1 스케일
}

/**
 * 정책 영향 분석
 */
export interface PolicyImpactAnalysis {
  readonly policyId: string;
  readonly actualVsPredicted: {
    readonly predicted: EconomicSystemState;
    readonly actual: EconomicSystemState;
    readonly accuracy: number;
  };
  readonly unintendedConsequences: string[];
  readonly adjustmentRecommendations: PolicyProposal[];
}
