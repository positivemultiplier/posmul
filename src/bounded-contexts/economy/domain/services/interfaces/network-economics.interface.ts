import {
  ActiveUserCount,
  MetcalfeValue,
  NetworkDensity,
  PMC,
  PMP,
  ReedValue,
} from "../../value-objects/economic-types";

/**
 * 네트워크 유형
 */
export enum NetworkType {
  /** 단방향 네트워크 (방송, 소셜 미디어 팔로우) */
  ONE_TO_MANY = "one_to_many",
  /** 양방향 네트워크 (통신, 소셜 네트워크) */
  MANY_TO_MANY = "many_to_many",
  /** 그룹 기반 네트워크 (커뮤니티, 플랫폼) */
  GROUP_FORMING = "group_forming",
}

/**
 * 네트워크 상태 정보
 */
export interface NetworkState {
  /** 활성 사용자 수 */
  activeUsers: ActiveUserCount;
  /** 총 연결 수 */
  totalConnections: number;
  /** 네트워크 밀도 (0-1) */
  density: NetworkDensity;
  /** 평균 연결 차수 */
  averageDegree: number;
  /** 클러스터링 계수 */
  clusteringCoefficient: number;
  /** 네트워크 지름 (최단 경로의 최대값) */
  diameter: number;
}

/**
 * 크로스 네트워크 효과 분석
 */
export interface CrossNetworkEffect {
  /** 소스 네트워크 타입 */
  sourceNetwork: NetworkType;
  /** 타겟 네트워크 타입 */
  targetNetwork: NetworkType;
  /** 상호작용 강도 (0-1) */
  interactionStrength: number;
  /** 시너지 계수 */
  synergyCoefficient: number;
  /** 예상 가치 증가 */
  expectedValueIncrease: PMP;
}

/**
 * 네트워크 가치 분석 결과
 */
export interface NetworkValueAnalysis {
  /** Metcalfe's Law 가치 (n²) */
  metcalfeValue: MetcalfeValue;
  /** Reed's Law 가치 (2^n) */
  reedValue: ReedValue;
  /** 실제 측정된 네트워크 가치 */
  actualValue: PMP;
  /** 가치 성장률 */
  growthRate: number;
  /** 네트워크 효과 지수 (실제값 대비 이론값) */
  networkEffectIndex: number;
  /** 임계 질량 달성 여부 */
  criticalMassAchieved: boolean;
}

/**
 * 네트워크 최적화 권장사항
 */
export interface NetworkOptimizationRecommendation {
  /** 권장 액션 */
  recommendedAction: string;
  /** 우선순위 (1-10) */
  priority: number;
  /** 예상 효과 */
  expectedImpact: {
    userGrowth: number;
    valueIncrease: PMP;
    engagementBoost: number;
  };
  /** 구현 복잡도 (1-10) */
  implementationComplexity: number;
  /** ROI 추정 */
  estimatedROI: number;
}

/**
 * 네트워크 생명주기 단계
 */
export enum NetworkLifecycleStage {
  /** 초기 단계 (사용자 확보) */
  EARLY_STAGE = "early_stage",
  /** 성장 단계 (바이럴 효과) */
  GROWTH_STAGE = "growth_stage",
  /** 성숙 단계 (최적화) */
  MATURE_STAGE = "mature_stage",
  /** 포화 단계 (혁신 필요) */
  SATURATION_STAGE = "saturation_stage",
  /** 쇠퇴 단계 (재활성화 필요) */
  DECLINE_STAGE = "decline_stage",
}

/**
 * Network Economics Engine 인터페이스
 *
 * Metcalfe's Law, Reed's Law, Cross-Network Effect를 활용한
 * 플랫폼 가치 극대화 엔진
 */
export interface INetworkEconomicsEngine {
  /**
   * Metcalfe's Law 기반 네트워크 가치 계산
   * Value = k × n² (k: 비례상수, n: 사용자 수)
   */
  calculateMetcalfeValue(
    userCount: ActiveUserCount,
    valuePerConnection: PMP
  ): MetcalfeValue;

  /**
   * Reed's Law 기반 그룹 형성 네트워크 가치 계산
   * Value = k × 2^n (그룹 형성 가능한 조합의 수)
   */
  calculateReedValue(
    userCount: ActiveUserCount,
    groupFormationRate: number
  ): ReedValue;

  /**
   * Cross-Network Effect 분석
   * 서로 다른 네트워크 간의 상호작용으로 발생하는 추가 가치
   */
  analyzeCrossNetworkEffects(
    networks: Array<{
      type: NetworkType;
      state: NetworkState;
      value: PMP;
    }>
  ): CrossNetworkEffect[];

  /**
   * 네트워크 밀도 최적화
   * 연결 밀도와 가치 창출의 최적 균형점 찾기
   */
  optimizeNetworkDensity(
    currentState: NetworkState,
    targetUserCount: ActiveUserCount,
    constraints: {
      maxConnections: number;
      qualityThreshold: number;
      maintenanceCost: PMC;
    }
  ): {
    optimalDensity: NetworkDensity;
    recommendedActions: string[];
    expectedValueIncrease: PMP;
    implementationCost: PMC;
  };

  /**
   * 네트워크 효과 측정
   * 실제 네트워크 가치와 이론적 가치 비교
   */
  measureNetworkEffects(
    networkState: NetworkState,
    actualValue: PMP,
    userEngagement: {
      averageSessionTime: number;
      monthlyActiveUsers: number;
      userRetentionRate: number;
    }
  ): NetworkValueAnalysis;

  /**
   * 임계 질량 분석
   * 네트워크 효과가 급격히 증가하는 임계점 계산
   */
  analyzeCriticalMass(
    networkType: NetworkType,
    currentUsers: ActiveUserCount,
    historicalGrowth: Array<{
      timestamp: Date;
      userCount: number;
      value: PMP;
      engagementMetrics: any;
    }>
  ): {
    estimatedCriticalMass: number;
    timeToReach: number; // days
    currentProgress: number; // 0-1
    accelerationStrategies: NetworkOptimizationRecommendation[];
  };

  /**
   * 네트워크 생명주기 단계 판별
   * 현재 네트워크의 발전 단계와 최적 전략 제시
   */
  identifyLifecycleStage(
    networkState: NetworkState,
    growthMetrics: {
      userGrowthRate: number;
      valueGrowthRate: number;
      churnRate: number;
      acquisitionCost: PMC;
    }
  ): {
    currentStage: NetworkLifecycleStage;
    stageCharacteristics: string[];
    recommendedStrategies: NetworkOptimizationRecommendation[];
    nextStageRequirements: string[];
  };

  /**
   * 네트워크 세분화 분석
   * 서브 네트워크별 가치 기여도 및 최적화 방안
   */
  analyzeNetworkSegmentation(
    segments: Array<{
      id: string;
      name: string;
      userCount: number;
      connections: number;
      value: PMP;
      characteristics: Record<string, any>;
    }>
  ): {
    segmentValues: Map<string, PMP>;
    crossSegmentSynergies: Array<{
      segment1: string;
      segment2: string;
      synergyValue: PMP;
    }>;
    optimizationOpportunities: Array<{
      segment: string;
      recommendation: NetworkOptimizationRecommendation;
    }>;
  };

  /**
   * 네트워크 보안 및 신뢰성 분석
   * 네트워크 공격 저항성과 신뢰 기반 가치 평가
   */
  analyzeNetworkResilience(
    networkState: NetworkState,
    trustMetrics: {
      averageTrustScore: number;
      verifiedUserRatio: number;
      reportedIncidents: number;
      resolutionTime: number;
    }
  ): {
    resilienceScore: number; // 0-1
    vulnerabilities: string[];
    trustBasedValueMultiplier: number;
    securityRecommendations: string[];
  };

  /**
   * 동적 가격 책정 모델
   * 네트워크 효과를 반영한 실시간 가격 조정
   */
  calculateDynamicPricing(
    basePrice: PMC,
    networkState: NetworkState,
    demandSignals: {
      currentDemand: number;
      priceElasticity: number;
      competitorPricing: PMC[];
    },
    objectives: {
      prioritizeGrowth: boolean;
      targetMargin: number;
      marketShare: number;
    }
  ): {
    recommendedPrice: PMC;
    priceJustification: string;
    expectedDemandChange: number;
    revenueImpact: PMP;
  };

  /**
   * 네트워크 진화 시뮬레이션
   * 다양한 시나리오 하에서 네트워크 발전 예측
   */
  simulateNetworkEvolution(
    currentState: NetworkState,
    scenarios: Array<{
      name: string;
      userGrowthRate: number;
      features: string[];
      marketConditions: any;
      timeHorizon: number; // months
    }>
  ): Array<{
    scenario: string;
    projectedStates: NetworkState[];
    projectedValues: PMP[];
    riskFactors: string[];
    confidence: number; // 0-1
  }>;
}
