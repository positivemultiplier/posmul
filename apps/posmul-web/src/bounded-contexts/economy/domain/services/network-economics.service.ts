import {
  ActiveUserCount,
  MetcalfeValue,
  NetworkDensity,
  PmcAmount,
  PmpAmount,
  ReedValue,
} from "../value-objects/economic-types";
import {
  createPmcAmount,
  createPmpAmount,
} from "../value-objects/economic-value-objects";
import {
  CrossNetworkEffect,
  INetworkEconomicsEngine,
  NetworkLifecycleStage,
  NetworkOptimizationRecommendation,
  NetworkState,
  NetworkType,
  NetworkValueAnalysis,
} from "./interfaces/network-economics.interface";

/**
 * Network Economics Engine Implementation
 *
 * Metcalfe's Law, Reed's Law, Cross-Network Effect를 활용한
 * 플랫폼 가치 극대화 엔진
 *
 * 기반 이론:
 * - Metcalfe's Law (1995): 네트워크 가치 = n²
 * - Reed's Law (1999): 그룹 형성 네트워크 가치 = 2^n
 * - Cross-Network Effects: 서로 다른 네트워크 간 상호작용 가치
 */
export class NetworkEconomicsEngine implements INetworkEconomicsEngine {
  private readonly METCALFE_SCALING_FACTOR = 1.0;
  private readonly REED_SCALING_FACTOR = 0.1;
  private readonly CRITICAL_MASS_THRESHOLD = 0.15; // 15% of potential market

  /**
   * Metcalfe's Law 기반 네트워크 가치 계산
   * V = k × n² where k is value per connection, n is number of users
   */
  calculateMetcalfeValue(
    userCount: ActiveUserCount,
    valuePerConnection: PmpAmount
  ): MetcalfeValue {
    const n = Number(userCount);
    const connectionValue = Number(valuePerConnection);

    // Metcalfe's Law: V = k × n × (n-1) / 2
    // Simplified to V = k × n² for large n
    const theoreticalConnections = (n * (n - 1)) / 2;
    const metcalfeValue =
      connectionValue * theoreticalConnections * this.METCALFE_SCALING_FACTOR;

    return metcalfeValue as MetcalfeValue;
  }

  /**
   * Reed's Law 기반 그룹 형성 네트워크 가치 계산
   * V = k × 2^n for group-forming networks
   */
  calculateReedValue(
    userCount: ActiveUserCount,
    groupFormationRate: number = 0.1
  ): ReedValue {
    const n = Number(userCount);

    // Reed's Law with practical constraints
    // Full 2^n grows too fast, so we use scaled version
    let reedValue: number;

    if (n <= 10) {
      // For small networks, use exponential growth
      reedValue =
        Math.pow(2, n) * groupFormationRate * this.REED_SCALING_FACTOR;
    } else {
      // For larger networks, use moderated exponential to prevent overflow
      // V = k × n × log₂(n) × 2^(n/10)
      reedValue =
        n *
        Math.log2(n) *
        Math.pow(2, n / 10) *
        groupFormationRate *
        this.REED_SCALING_FACTOR;
    }

    return Math.min(reedValue, Number.MAX_SAFE_INTEGER) as ReedValue;
  }

  /**
   * Cross-Network Effect 분석
   */
  analyzeCrossNetworkEffects(
    networks: Array<{
      type: NetworkType;
      state: NetworkState;
      value: PmpAmount;
    }>
  ): CrossNetworkEffect[] {
    const effects: CrossNetworkEffect[] = [];

    for (let i = 0; i < networks.length; i++) {
      for (let j = i + 1; j < networks.length; j++) {
        const network1 = networks[i];
        const network2 = networks[j];

        const interactionStrength = this.calculateInteractionStrength(
          network1.type,
          network2.type
        );

        const synergyCoefficient = this.calculateSynergyCoefficient(
          network1.state,
          network2.state
        );

        const expectedValueIncrease = createPmpAmount(
          Math.round(
            (Number(network1.value) + Number(network2.value)) *
              interactionStrength *
              synergyCoefficient *
              0.1
          )
        );

        effects.push({
          sourceNetwork: network1.type,
          targetNetwork: network2.type,
          interactionStrength,
          synergyCoefficient,
          expectedValueIncrease,
        });
      }
    }

    return effects;
  }

  /**
   * 네트워크 밀도 최적화
   */
  optimizeNetworkDensity(
    currentState: NetworkState,
    targetUserCount: ActiveUserCount,
    constraints: {
      maxConnections: number;
      qualityThreshold: number;
      maintenanceCost: PmcAmount;
    }
  ): {
    optimalDensity: NetworkDensity;
    recommendedActions: string[];
    expectedValueIncrease: PmpAmount;
    implementationCost: PmcAmount;
  } {
    const currentUsers = Number(currentState.activeUsers);
    const targetUsers = Number(targetUserCount);
    const currentDensity = Number(currentState.density);

    // 최적 밀도 계산: 가치 최대화와 비용 최소화의 균형
    const maxPossibleConnections = (targetUsers * (targetUsers - 1)) / 2;
    const constrainedMaxConnections = Math.min(
      maxPossibleConnections,
      constraints.maxConnections
    );

    // Dunbar's number와 network theory를 고려한 최적 밀도
    // 일반적으로 0.1-0.3 사이가 최적
    const optimalDensity = Math.min(
      0.25, // 이론적 최적값
      constrainedMaxConnections / maxPossibleConnections,
      constraints.qualityThreshold
    );

    const recommendedActions: string[] = [];

    if (currentDensity < optimalDensity * 0.8) {
      recommendedActions.push("연결 촉진 이벤트 실행");
      recommendedActions.push("추천 시스템 개선");
      recommendedActions.push("소셜 기능 강화");
    } else if (currentDensity > optimalDensity * 1.2) {
      recommendedActions.push("연결 품질 필터링 강화");
      recommendedActions.push("스팸 방지 시스템 개선");
      recommendedActions.push("고품질 연결 우선순위 부여");
    } else {
      recommendedActions.push("현재 밀도 유지");
      recommendedActions.push("연결 품질 모니터링 강화");
    }

    const densityImprovement = Math.abs(optimalDensity - currentDensity);
    const expectedValueIncrease = createPmpAmount(
      Math.round(targetUsers * targetUsers * densityImprovement * 10)
    );

    const implementationCost = createPmcAmount(
      Math.round(Number(constraints.maintenanceCost) * (1 + densityImprovement))
    );

    return {
      optimalDensity: optimalDensity as NetworkDensity,
      recommendedActions,
      expectedValueIncrease,
      implementationCost,
    };
  }

  /**
   * 네트워크 효과 측정
   */
  measureNetworkEffects(
    networkState: NetworkState,
    actualValue: PmpAmount,
    userEngagement: {
      averageSessionTime: number;
      monthlyActiveUsers: number;
      userRetentionRate: number;
    }
  ): NetworkValueAnalysis {
    const userCount = Number(networkState.activeUsers);
    const actualVal = Number(actualValue);

    // 이론적 Metcalfe 가치 계산
    const metcalfeValue = this.calculateMetcalfeValue(
      networkState.activeUsers,
      createPmpAmount(10) // 기본 연결당 가치
    );

    // 이론적 Reed 가치 계산
    const reedValue = this.calculateReedValue(networkState.activeUsers, 0.1);

    // 성장률 계산 (단순화된 버전)
    const engagementMultiplier =
      (userEngagement.averageSessionTime / 3600) * // 시간을 정규화
      (userEngagement.monthlyActiveUsers / userCount) *
      userEngagement.userRetentionRate;

    const growthRate = Math.min(0.5, engagementMultiplier * 0.1); // 최대 50% 성장률

    // 네트워크 효과 지수
    const theoreticalValue = Math.max(Number(metcalfeValue), Number(reedValue));
    const networkEffectIndex =
      theoreticalValue > 0 ? actualVal / theoreticalValue : 0;

    // 임계 질량 달성 여부
    const estimatedMarketSize = userCount / this.CRITICAL_MASS_THRESHOLD;
    const criticalMassAchieved =
      userCount >= estimatedMarketSize * this.CRITICAL_MASS_THRESHOLD;

    return {
      metcalfeValue,
      reedValue,
      actualValue,
      growthRate,
      networkEffectIndex: Math.min(5.0, networkEffectIndex), // 최대 5배로 제한
      criticalMassAchieved,
    };
  }

  /**
   * 임계 질량 분석
   */
  analyzeCriticalMass(
    networkType: NetworkType,
    currentUsers: ActiveUserCount,
    historicalGrowth: Array<{
      timestamp: Date;
      userCount: number;
      value: PmpAmount;
      engagementMetrics: any;
    }>
  ): {
    estimatedCriticalMass: number;
    timeToReach: number;
    currentProgress: number;
    accelerationStrategies: NetworkOptimizationRecommendation[];
  } {
    const currentUserCount = Number(currentUsers);

    // 네트워크 타입별 임계 질량 추정
    let criticalMassMultiplier: number;
    switch (networkType) {
      case NetworkType.ONE_TO_MANY:
        criticalMassMultiplier = 1000; // 방송형은 상대적으로 낮은 임계점
        break;
      case NetworkType.MANY_TO_MANY:
        criticalMassMultiplier = 10000; // 통신형은 높은 임계점 필요
        break;
      case NetworkType.GROUP_FORMING:
        criticalMassMultiplier = 5000; // 그룹형은 중간 수준
        break;
      default:
        criticalMassMultiplier = 5000;
    }

    const estimatedCriticalMass = criticalMassMultiplier;

    // 현재 진행률
    const currentProgress = Math.min(
      1.0,
      currentUserCount / estimatedCriticalMass
    );

    // 성장률 분석
    let averageGrowthRate = 0.1; // 기본 10% 월 성장률
    if (historicalGrowth.length >= 2) {
      const growthRates = [];
      for (let i = 1; i < historicalGrowth.length; i++) {
        const prevCount = historicalGrowth[i - 1].userCount;
        const currentCount = historicalGrowth[i].userCount;
        if (prevCount > 0) {
          growthRates.push((currentCount - prevCount) / prevCount);
        }
      }
      if (growthRates.length > 0) {
        averageGrowthRate =
          growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
      }
    }

    // 임계 질량 도달 시간 추정
    let timeToReach = 365; // 기본 1년
    if (averageGrowthRate > 0) {
      const remainingUsers = estimatedCriticalMass - currentUserCount;
      const monthsToReach =
        Math.log(1 + remainingUsers / currentUserCount) /
        Math.log(1 + averageGrowthRate);
      timeToReach = Math.max(30, monthsToReach * 30); // 최소 30일
    }

    // 가속화 전략
    const accelerationStrategies: NetworkOptimizationRecommendation[] = [
      {
        recommendedAction: "바이럴 마케팅 캠페인 실행",
        priority: 9,
        expectedImpact: {
          userGrowth: 0.5,
          valueIncrease: createPmpAmount(Math.round(currentUserCount * 100)),
          engagementBoost: 0.3,
        },
        implementationComplexity: 6,
        estimatedROI: 3.5,
      },
      {
        recommendedAction: "추천 보상 시스템 도입",
        priority: 8,
        expectedImpact: {
          userGrowth: 0.3,
          valueIncrease: createPmpAmount(Math.round(currentUserCount * 150)),
          engagementBoost: 0.4,
        },
        implementationComplexity: 4,
        estimatedROI: 4.2,
      },
      {
        recommendedAction: "핵심 기능 개선을 통한 리텐션 향상",
        priority: 10,
        expectedImpact: {
          userGrowth: 0.2,
          valueIncrease: createPmpAmount(Math.round(currentUserCount * 200)),
          engagementBoost: 0.6,
        },
        implementationComplexity: 7,
        estimatedROI: 5.1,
      },
    ];

    return {
      estimatedCriticalMass,
      timeToReach,
      currentProgress,
      accelerationStrategies,
    };
  }

  /**
   * 네트워크 생명주기 단계 판별
   */
  identifyLifecycleStage(
    networkState: NetworkState,
    growthMetrics: {
      userGrowthRate: number;
      valueGrowthRate: number;
      churnRate: number;
      acquisitionCost: PmcAmount;
    }
  ): {
    currentStage: NetworkLifecycleStage;
    stageCharacteristics: string[];
    recommendedStrategies: NetworkOptimizationRecommendation[];
    nextStageRequirements: string[];
  } {
    const userCount = Number(networkState.activeUsers);
    const { userGrowthRate, valueGrowthRate, churnRate } = growthMetrics;

    let currentStage: NetworkLifecycleStage;
    let stageCharacteristics: string[];
    let recommendedStrategies: NetworkOptimizationRecommendation[];
    let nextStageRequirements: string[];

    // 단계 판별 로직
    if (userCount < 1000 && userGrowthRate > 0.2) {
      currentStage = NetworkLifecycleStage.EARLY_STAGE;
      stageCharacteristics = [
        "낮은 사용자 기반",
        "높은 성장률",
        "제품-시장 적합성 탐색",
        "높은 실험 비율",
      ];
      nextStageRequirements = [
        "1,000명 이상 활성 사용자 달성",
        "월 성장률 20% 이상 유지",
        "핵심 가치 제안 검증",
      ];
    } else if (userCount < 10000 && userGrowthRate > 0.1 && churnRate < 0.1) {
      currentStage = NetworkLifecycleStage.GROWTH_STAGE;
      stageCharacteristics = [
        "빠른 사용자 증가",
        "바이럴 효과 시작",
        "네트워크 효과 가시화",
        "스케일링 도전",
      ];
      nextStageRequirements = [
        "10,000명 이상 활성 사용자",
        "안정적인 인프라 구축",
        "수익화 모델 확립",
      ];
    } else if (userGrowthRate > 0.05 && valueGrowthRate > userGrowthRate) {
      currentStage = NetworkLifecycleStage.MATURE_STAGE;
      stageCharacteristics = [
        "안정적인 사용자 기반",
        "높은 사용자 참여도",
        "효율적인 운영",
        "수익성 확보",
      ];
      nextStageRequirements = [
        "새로운 시장 진입",
        "혁신적인 기능 개발",
        "생태계 확장",
      ];
    } else if (userGrowthRate < 0.02 && churnRate < 0.05) {
      currentStage = NetworkLifecycleStage.SATURATION_STAGE;
      stageCharacteristics = [
        "성장률 둔화",
        "시장 포화",
        "경쟁 심화",
        "효율성 중시",
      ];
      nextStageRequirements = [
        "새로운 가치 제안 개발",
        "인접 시장 진출",
        "플랫폼 혁신",
      ];
    } else {
      currentStage = NetworkLifecycleStage.DECLINE_STAGE;
      stageCharacteristics = [
        "사용자 감소",
        "참여도 하락",
        "수익성 악화",
        "재활성화 필요",
      ];
      nextStageRequirements = [
        "근본적인 제품 혁신",
        "새로운 시장 탐색",
        "비즈니스 모델 전환",
      ];
    }

    // 단계별 최적화 전략
    recommendedStrategies = this.getStageSpecificStrategies(
      currentStage,
      userCount
    );

    return {
      currentStage,
      stageCharacteristics,
      recommendedStrategies,
      nextStageRequirements,
    };
  }

  /**
   * 네트워크 세분화 분석
   */
  analyzeNetworkSegmentation(
    segments: Array<{
      id: string;
      name: string;
      userCount: number;
      connections: number;
      value: PmpAmount;
      characteristics: Record<string, any>;
    }>
  ): {
    segmentValues: Map<string, PmpAmount>;
    crossSegmentSynergies: Array<{
      segment1: string;
      segment2: string;
      synergyValue: PmpAmount;
    }>;
    optimizationOpportunities: Array<{
      segment: string;
      recommendation: NetworkOptimizationRecommendation;
    }>;
  } {
    const segmentValues = new Map<string, PmpAmount>();
    const crossSegmentSynergies: Array<{
      segment1: string;
      segment2: string;
      synergyValue: PmpAmount;
    }> = [];

    // 각 세그먼트의 가치 계산
    segments.forEach((segment) => {
      const metcalfeValue = this.calculateMetcalfeValue(
        segment.userCount as ActiveUserCount,
        createPmpAmount(
          Number(segment.value) / Math.max(1, segment.connections)
        )
      );
      segmentValues.set(segment.id, createPmpAmount(Number(metcalfeValue)));
    });

    // 세그먼트 간 시너지 분석
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const seg1 = segments[i];
        const seg2 = segments[j];

        // 시너지 가치 계산 (단순화된 버전)
        const crossConnections =
          Math.min(seg1.connections, seg2.connections) * 0.1;
        const synergyValue = createPmpAmount(
          Math.round(
            crossConnections *
              ((Number(seg1.value) + Number(seg2.value)) / 2) *
              0.05
          )
        );

        crossSegmentSynergies.push({
          segment1: seg1.id,
          segment2: seg2.id,
          synergyValue,
        });
      }
    }

    // 최적화 기회 분석
    const optimizationOpportunities = segments.map((segment) => {
      const efficiency =
        segment.connections > 0
          ? Number(segment.value) / segment.connections
          : 0;
      const potentialGrowth = Math.max(
        0,
        segments.reduce((max, s) => Math.max(max, s.userCount), 0) -
          segment.userCount
      );

      return {
        segment: segment.id,
        recommendation: {
          recommendedAction:
            efficiency < 50
              ? `${segment.name} 세그먼트의 연결 효율성 개선`
              : `${segment.name} 세그먼트의 사용자 확대`,
          priority: efficiency < 50 ? 8 : 6,
          expectedImpact: {
            userGrowth: potentialGrowth / segment.userCount,
            valueIncrease: createPmpAmount(Math.round(segment.userCount * 50)),
            engagementBoost: efficiency < 50 ? 0.4 : 0.2,
          },
          implementationComplexity: efficiency < 50 ? 4 : 6,
          estimatedROI: efficiency < 50 ? 3.2 : 2.1,
        },
      };
    });

    return {
      segmentValues,
      crossSegmentSynergies,
      optimizationOpportunities,
    };
  }

  /**
   * 네트워크 보안 및 신뢰성 분석
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
    resilienceScore: number;
    vulnerabilities: string[];
    trustBasedValueMultiplier: number;
    securityRecommendations: string[];
  } {
    const density = Number(networkState.density);
    const {
      averageTrustScore,
      verifiedUserRatio,
      reportedIncidents,
      resolutionTime,
    } = trustMetrics;

    // 복원력 점수 계산 (0-1)
    const densityResilience = Math.min(1.0, density * 2); // 적절한 밀도는 복원력 향상
    const trustResilience = averageTrustScore;
    const verificationResilience = verifiedUserRatio;
    const incidentResilience = Math.max(0, 1 - reportedIncidents / 100);
    const responseResilience = Math.max(0, 1 - resolutionTime / (24 * 60)); // 24시간 기준

    const resilienceScore =
      densityResilience * 0.2 +
      trustResilience * 0.3 +
      verificationResilience * 0.2 +
      incidentResilience * 0.15 +
      responseResilience * 0.15;

    // 취약점 식별
    const vulnerabilities: string[] = [];
    if (density < 0.1) vulnerabilities.push("네트워크 밀도 부족 - 단절 위험");
    if (averageTrustScore < 0.7)
      vulnerabilities.push("낮은 신뢰 점수 - 사용자 이탈 위험");
    if (verifiedUserRatio < 0.5)
      vulnerabilities.push("검증되지 않은 사용자 비율 높음");
    if (reportedIncidents > 50) vulnerabilities.push("높은 사고 발생률");
    if (resolutionTime > 12 * 60) vulnerabilities.push("느린 사고 대응 시간");

    // 신뢰 기반 가치 승수
    const trustBasedValueMultiplier = Math.min(
      2.0,
      0.5 + 1.5 * averageTrustScore
    );

    // 보안 권장사항
    const securityRecommendations: string[] = [];
    if (verifiedUserRatio < 0.8) {
      securityRecommendations.push("사용자 검증 프로세스 강화");
    }
    if (reportedIncidents > 20) {
      securityRecommendations.push("자동 모니터링 시스템 도입");
    }
    if (resolutionTime > 6 * 60) {
      securityRecommendations.push("사고 대응팀 확대 및 자동화 개선");
    }
    if (averageTrustScore < 0.8) {
      securityRecommendations.push("신뢰 구축 프로그램 실행");
    }

    return {
      resilienceScore,
      vulnerabilities,
      trustBasedValueMultiplier,
      securityRecommendations,
    };
  }

  /**
   * 동적 가격 책정 모델
   */
  calculateDynamicPricing(
    basePrice: PmcAmount,
    networkState: NetworkState,
    demandSignals: {
      currentDemand: number;
      priceElasticity: number;
      competitorPricing: PmcAmount[];
    },
    objectives: {
      prioritizeGrowth: boolean;
      targetMargin: number;
      marketShare: number;
    }
  ): {
    recommendedPrice: PmcAmount;
    priceJustification: string;
    expectedDemandChange: number;
    revenueImpact: PmpAmount;
  } {
    const basePriceNum = Number(basePrice);
    const userCount = Number(networkState.activeUsers);
    const { currentDemand, priceElasticity, competitorPricing } = demandSignals;
    const { prioritizeGrowth, targetMargin, marketShare } = objectives;

    // 네트워크 효과 기반 가격 조정
    const networkPremium = Math.min(0.5, userCount / 10000); // 최대 50% 프리미엄

    // 경쟁사 가격 분석
    const avgCompetitorPrice =
      competitorPricing.length > 0
        ? competitorPricing.reduce((sum, price) => sum + Number(price), 0) /
          competitorPricing.length
        : basePriceNum;

    // 수요 기반 조정
    const demandMultiplier = Math.max(0.5, Math.min(2.0, currentDemand));

    // 목표 기반 조정
    let strategicMultiplier = 1.0;
    if (prioritizeGrowth) {
      strategicMultiplier = 0.8; // 20% 할인으로 성장 촉진
    } else if (marketShare < 0.1) {
      strategicMultiplier = 0.9; // 10% 할인으로 시장 점유율 확대
    }

    // 최종 가격 계산
    let recommendedPriceNum =
      basePriceNum *
      (1 + networkPremium) *
      demandMultiplier *
      strategicMultiplier;

    // 경쟁사 대비 조정
    if (recommendedPriceNum > avgCompetitorPrice * 1.2) {
      recommendedPriceNum = avgCompetitorPrice * 1.1; // 최대 10% 프리미엄
    }

    // 마진 확보
    const minimumPrice = basePriceNum * (1 + targetMargin);
    recommendedPriceNum = Math.max(recommendedPriceNum, minimumPrice);

    const recommendedPrice = createPmcAmount(Math.round(recommendedPriceNum));

    // 수요 변화 예측
    const priceChange = (recommendedPriceNum - basePriceNum) / basePriceNum;
    const expectedDemandChange = -priceElasticity * priceChange;

    // 매출 영향 계산
    const currentRevenue = basePriceNum * currentDemand;
    const newRevenue =
      recommendedPriceNum * currentDemand * (1 + expectedDemandChange);
    const revenueImpact = createPmpAmount(
      Math.round(newRevenue - currentRevenue)
    );

    // 가격 정당화
    const priceJustification = this.generatePriceJustification(
      priceChange,
      networkPremium,
      demandMultiplier,
      strategicMultiplier,
      prioritizeGrowth
    );

    return {
      recommendedPrice,
      priceJustification,
      expectedDemandChange,
      revenueImpact,
    };
  }

  /**
   * 네트워크 진화 시뮬레이션
   */
  simulateNetworkEvolution(
    currentState: NetworkState,
    scenarios: Array<{
      name: string;
      userGrowthRate: number;
      features: string[];
      marketConditions: any;
      timeHorizon: number;
    }>
  ): Array<{
    scenario: string;
    projectedStates: NetworkState[];
    projectedValues: PmpAmount[];
    riskFactors: string[];
    confidence: number;
  }> {
    return scenarios.map((scenario) => {
      const projectedStates: NetworkState[] = [];
      const projectedValues: PmpAmount[] = [];

      let currentUsers = Number(currentState.activeUsers);
      let currentDensity = Number(currentState.density);

      // 월별 시뮬레이션
      for (let month = 1; month <= scenario.timeHorizon; month++) {
        // 사용자 성장
        currentUsers = Math.round(currentUsers * (1 + scenario.userGrowthRate));

        // 밀도 조정 (사용자 증가에 따른 자연스러운 변화)
        const naturalDensityDecline = 0.95; // 사용자 증가 시 밀도는 약간 감소
        currentDensity = Math.max(0.05, currentDensity * naturalDensityDecline);

        // 특성 기반 조정
        if (scenario.features.includes("viral_features")) {
          currentUsers = Math.round(currentUsers * 1.1);
        }
        if (scenario.features.includes("engagement_boost")) {
          currentDensity = Math.min(0.5, currentDensity * 1.05);
        }

        const projectedState: NetworkState = {
          activeUsers: currentUsers as ActiveUserCount,
          totalConnections: Math.round(
            (currentUsers * currentUsers * currentDensity) / 2
          ),
          density: currentDensity as NetworkDensity,
          averageDegree: currentUsers * currentDensity,
          clusteringCoefficient: Math.max(0.1, currentDensity * 0.8),
          diameter: Math.ceil(
            Math.log(currentUsers) / Math.log(currentDensity * currentUsers)
          ),
        };

        projectedStates.push(projectedState);

        // 가치 계산
        const metcalfeValue = this.calculateMetcalfeValue(
          projectedState.activeUsers,
          createPmpAmount(10)
        );
        projectedValues.push(createPmpAmount(Number(metcalfeValue)));
      }

      // 리스크 요인 식별
      const riskFactors: string[] = [];
      if (scenario.userGrowthRate > 0.5) {
        riskFactors.push("과도한 성장률로 인한 품질 저하 위험");
      }
      if (scenario.userGrowthRate < 0.05) {
        riskFactors.push("낮은 성장률로 인한 경쟁력 상실 위험");
      }
      if (scenario.features.length === 0) {
        riskFactors.push("혁신 부족으로 인한 정체 위험");
      }

      // 신뢰도 계산
      const baseConfidence = 0.8;
      const growthVolatility = Math.abs(scenario.userGrowthRate - 0.1) * 2; // 10% 성장 기준
      const featureBonus = scenario.features.length * 0.05;
      const confidence = Math.max(
        0.3,
        Math.min(0.95, baseConfidence - growthVolatility + featureBonus)
      );

      return {
        scenario: scenario.name,
        projectedStates,
        projectedValues,
        riskFactors,
        confidence,
      };
    });
  }

  // Private helper methods

  private calculateInteractionStrength(
    type1: NetworkType,
    type2: NetworkType
  ): number {
    // 네트워크 타입 간 상호작용 강도 매트릭스
    const interactionMatrix: Record<string, Record<string, number>> = {
      [NetworkType.ONE_TO_MANY]: {
        [NetworkType.MANY_TO_MANY]: 0.6,
        [NetworkType.GROUP_FORMING]: 0.8,
      },
      [NetworkType.MANY_TO_MANY]: {
        [NetworkType.ONE_TO_MANY]: 0.6,
        [NetworkType.GROUP_FORMING]: 0.9,
      },
      [NetworkType.GROUP_FORMING]: {
        [NetworkType.ONE_TO_MANY]: 0.8,
        [NetworkType.MANY_TO_MANY]: 0.9,
      },
    };

    return interactionMatrix[type1]?.[type2] || 0.5;
  }

  private calculateSynergyCoefficient(
    state1: NetworkState,
    state2: NetworkState
  ): number {
    const density1 = Number(state1.density);
    const density2 = Number(state2.density);
    const users1 = Number(state1.activeUsers);
    const users2 = Number(state2.activeUsers);

    // 규모와 밀도의 조화에 따른 시너지
    const scaleBalance = Math.min(users1, users2) / Math.max(users1, users2);
    const densityBalance =
      Math.min(density1, density2) / Math.max(density1, density2);

    return (scaleBalance + densityBalance) / 2;
  }

  private getStageSpecificStrategies(
    stage: NetworkLifecycleStage,
    userCount: number
  ): NetworkOptimizationRecommendation[] {
    const baseValue = Math.round(userCount * 50);

    switch (stage) {
      case NetworkLifecycleStage.EARLY_STAGE:
        return [
          {
            recommendedAction: "제품-시장 적합성 검증 및 피벗",
            priority: 10,
            expectedImpact: {
              userGrowth: 0.8,
              valueIncrease: createPmpAmount(baseValue * 2),
              engagementBoost: 0.6,
            },
            implementationComplexity: 8,
            estimatedROI: 4.5,
          },
        ];

      case NetworkLifecycleStage.GROWTH_STAGE:
        return [
          {
            recommendedAction: "바이럴 메커니즘 최적화",
            priority: 9,
            expectedImpact: {
              userGrowth: 0.6,
              valueIncrease: createPmpAmount(baseValue * 3),
              engagementBoost: 0.4,
            },
            implementationComplexity: 6,
            estimatedROI: 5.2,
          },
        ];

      case NetworkLifecycleStage.MATURE_STAGE:
        return [
          {
            recommendedAction: "사용자 세분화 및 개인화",
            priority: 8,
            expectedImpact: {
              userGrowth: 0.3,
              valueIncrease: createPmpAmount(baseValue * 1.5),
              engagementBoost: 0.5,
            },
            implementationComplexity: 7,
            estimatedROI: 3.8,
          },
        ];

      default:
        return [
          {
            recommendedAction: "혁신적인 기능 개발",
            priority: 7,
            expectedImpact: {
              userGrowth: 0.4,
              valueIncrease: createPmpAmount(baseValue),
              engagementBoost: 0.3,
            },
            implementationComplexity: 9,
            estimatedROI: 2.5,
          },
        ];
    }
  }

  private generatePriceJustification(
    priceChange: number,
    networkPremium: number,
    demandMultiplier: number,
    strategicMultiplier: number,
    prioritizeGrowth: boolean
  ): string {
    const reasons: string[] = [];

    if (networkPremium > 0.1) {
      reasons.push(
        `네트워크 효과 가치 반영 (+${Math.round(networkPremium * 100)}%)`
      );
    }

    if (demandMultiplier > 1.2) {
      reasons.push("높은 수요 상황 반영");
    } else if (demandMultiplier < 0.8) {
      reasons.push("수요 부족 고려한 할인");
    }

    if (prioritizeGrowth) {
      reasons.push("성장 우선 전략으로 인한 할인");
    }

    if (priceChange > 0.1) {
      reasons.push("시장 프리미엄 포지셔닝");
    } else if (priceChange < -0.1) {
      reasons.push("시장 침투 전략");
    }

    return reasons.length > 0
      ? reasons.join(", ")
      : "시장 조건 반영한 적정 가격";
  }
}
