/**
 * Risk Management Application Service
 * 리스크 관리 관련 애플리케이션 서비스
 */

import { Result } from "@posmul/auth-economy-sdk";

import {
  EconomicSystemState,
  RiskAssessment,
  RiskManagementService,
  TaylorRuleResult,
} from "../../domain/services";
import {
  AutoEconomicPolicyAdjustmentUseCase,
  EmergencyCircuitBreakerUseCase,
  MonitorSystemStabilityUseCase,
  OptimizeIncentiveMechanismUseCase,
} from "../use-cases/risk-management.use-cases";

/**
 * 리스크 관리 애플리케이션 서비스
 */
export class RiskManagementApplicationService {
  private readonly monitorStabilityUseCase: MonitorSystemStabilityUseCase;
  private readonly autoAdjustmentUseCase: AutoEconomicPolicyAdjustmentUseCase;
  private readonly circuitBreakerUseCase: EmergencyCircuitBreakerUseCase;
  private readonly optimizeIncentiveUseCase: OptimizeIncentiveMechanismUseCase;

  constructor(private readonly riskManagementService: RiskManagementService) {
    this.monitorStabilityUseCase = new MonitorSystemStabilityUseCase(
      riskManagementService
    );
    this.autoAdjustmentUseCase = new AutoEconomicPolicyAdjustmentUseCase(
      riskManagementService
    );
    this.circuitBreakerUseCase = new EmergencyCircuitBreakerUseCase(
      riskManagementService
    );
    this.optimizeIncentiveUseCase = new OptimizeIncentiveMechanismUseCase(
      riskManagementService
    );
  }

  /**
   * 종합적인 리스크 대시보드 데이터 조회
   */
  async getRiskDashboard(systemState: EconomicSystemState): Promise<
    Result<{
      currentRisk: RiskAssessment;
      stabilityStatus: {
        isStable: boolean;
        immediateActions: string[];
      };
      policyRecommendations: {
        pmpIssuanceChange: number;
        pmcConversionChange: number;
        recommendedInterestRate: number;
        reasoning: string;
        urgency: string;
      };
      circuitBreakerStatus: {
        isActive: boolean;
        reason?: string;
        expectedRecovery?: number;
      };
    }>
  > {
    try {
      // 안정성 모니터링
      const stabilityResult = await this.monitorStabilityUseCase.execute(
        systemState
      );
      if (!stabilityResult.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다.")
        };
      }

      // 정책 권고안
      const policyResult = await this.autoAdjustmentUseCase.execute(
        systemState
      );
      if (!policyResult.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다.")
        };
      }

      // Circuit Breaker 상태
      const circuitBreakerResult = await this.circuitBreakerUseCase.execute(
        systemState
      );
      if (!circuitBreakerResult.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다.")
        };
      }

      return {
        success: true,
        data: {
          currentRisk: stabilityResult.data.riskAssessment,
          stabilityStatus: {
            isStable: stabilityResult.data.isStable,
            immediateActions: stabilityResult.data.immediateActions,
          },
          policyRecommendations: {
            pmpIssuanceChange: policyResult.data.adjustments.pmpIssuanceChange,
            pmcConversionChange:
              policyResult.data.adjustments.pmcConversionChange,
            recommendedInterestRate:
              policyResult.data.adjustments.recommendedInterestRate,
            reasoning: policyResult.data.reasoning,
            urgency: policyResult.data.urgency,
          },
          circuitBreakerStatus: {
            isActive: circuitBreakerResult.data.circuitBreakerActivated,
            reason: circuitBreakerResult.data.reason,
            expectedRecovery: circuitBreakerResult.data.expectedDuration,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `리스크 대시보드 조회 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }

  /**
   * 실시간 리스크 평가
   */
  async assessCurrentRisk(
    systemState: EconomicSystemState
  ): Promise<Result<RiskAssessment>> {
    try {
      return this.riskManagementService.assessSystemRisk(systemState);
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `현재 리스크 평가 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }

  /**
   * Taylor Rule 기반 정책 권고
   */
  async getTaylorRuleRecommendation(
    systemState: EconomicSystemState
  ): Promise<Result<TaylorRuleResult>> {
    try {
      return this.riskManagementService.calculateTaylorRule(systemState);
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `Taylor Rule 권고 생성 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }

  /**
   * 인센티브 메커니즘 최적화
   */
  async optimizeIncentives(
    systemState: EconomicSystemState,
    userBehaviorData: {
      participationRate: number;
      averageContribution: number;
      userCount: number;
      engagementScore: number;
    }
  ): Promise<
    Result<{
      optimizedIncentives: {
        rewardRate: number;
        feeStructure: number;
        alignmentScore: number;
      };
      expectedImpact: {
        participationIncrease: number;
        contributionIncrease: number;
        stabilityImprovement: number;
      };
      implementationPlan: string[];
    }>
  > {
    try {
      return await this.optimizeIncentiveUseCase.execute(
        systemState,
        userBehaviorData
      );
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `인센티브 최적화 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }

  /**
   * 긴급 상황 처리
   */
  async handleEmergency(systemState: EconomicSystemState): Promise<
    Result<{
      emergencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      actions: string[];
      circuitBreakerActivated: boolean;
      estimatedRecoveryTime: number;
    }>
  > {
    try {
      // 리스크 평가
      const riskResult = await this.assessCurrentRisk(systemState);
      if (!riskResult.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다.")
        };
      }

      // Circuit Breaker 실행
      const circuitBreakerResult = await this.circuitBreakerUseCase.execute(
        systemState
      );
      if (!circuitBreakerResult.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다.")
        };
      }

      // 긴급도 결정
      const emergencyLevel = this.determineEmergencyLevel(riskResult.data);

      // 필요한 액션들 수집
      const actions = [
        ...riskResult.data.recommendations,
        ...circuitBreakerResult.data.emergencyActions,
      ];

      return {
        success: true,
        data: {
          emergencyLevel,
          actions,
          circuitBreakerActivated:
            circuitBreakerResult.data.circuitBreakerActivated,
          estimatedRecoveryTime: circuitBreakerResult.data.expectedDuration,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `긴급 상황 처리 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }

  /**
   * 시계열 리스크 분석
   */
  async analyzeRiskTrends(
    historicalStates: { timestamp: Date; state: EconomicSystemState }[]
  ): Promise<
    Result<{
      trendAnalysis: {
        overallDirection: "IMPROVING" | "STABLE" | "DETERIORATING";
        keyIndicators: {
          metric: string;
          trend: "UP" | "DOWN" | "STABLE";
          changeRate: number;
        }[];
      };
      forecastedRisk: {
        next7Days: string; // RiskLevel
        next30Days: string; // RiskLevel
        confidence: number;
      };
      recommendations: string[];
    }>
  > {
    try {
      if (historicalStates.length < 7) {
        return {
          success: false,
          error: new Error("분석을 위해 최소 7일간의 데이터가 필요합니다"),
        };
      }

      // 트렌드 분석
      const trendAnalysis = this.analyzeTrends(historicalStates);

      // 예측
      const forecastedRisk = this.forecastRisk(historicalStates);

      // 권고사항
      const recommendations = this.generateTrendBasedRecommendations(
        trendAnalysis,
        forecastedRisk
      );

      return {
        success: true,
        data: {
          trendAnalysis,
          forecastedRisk,
          recommendations,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `리스크 트렌드 분석 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }

  private determineEmergencyLevel(
    riskAssessment: RiskAssessment
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (riskAssessment.circuitBreakerTriggered) return "CRITICAL";

    switch (riskAssessment.overallRisk) {
      case "CRITICAL":
        return "CRITICAL";
      case "HIGH":
        return "HIGH";
      case "MEDIUM":
        return "MEDIUM";
      default:
        return "LOW";
    }
  }

  private analyzeTrends(
    historicalStates: { timestamp: Date; state: EconomicSystemState }[]
  ) {
    const recent = historicalStates.slice(-7); // 최근 7일
    const previous = historicalStates.slice(-14, -7); // 이전 7일

    const recentAvg = this.calculateAverageState(recent.map((h) => h.state));
    const previousAvg = this.calculateAverageState(
      previous.map((h) => h.state)
    );

    const keyIndicators = [
      {
        metric: "Liquidity Ratio",
        trend: this.compareTrend(
          recentAvg.liquidityRatio,
          previousAvg.liquidityRatio
        ),
        changeRate:
          (recentAvg.liquidityRatio - previousAvg.liquidityRatio) /
          previousAvg.liquidityRatio,
      },
      {
        metric: "Inflation Rate",
        trend: this.compareTrend(
          recentAvg.inflationRate,
          previousAvg.inflationRate
        ),
        changeRate:
          (recentAvg.inflationRate - previousAvg.inflationRate) /
          Math.abs(previousAvg.inflationRate || 1),
      },
      {
        metric: "Price Volatility",
        trend: this.compareTrend(
          recentAvg.priceVolatility,
          previousAvg.priceVolatility
        ),
        changeRate:
          (recentAvg.priceVolatility - previousAvg.priceVolatility) /
          previousAvg.priceVolatility,
      },
    ];

    // 전반적인 방향 결정
    const positiveChanges = keyIndicators.filter(
      (k) =>
        (k.metric === "Liquidity Ratio" && k.trend === "UP") ||
        (k.metric !== "Liquidity Ratio" && k.trend === "DOWN")
    ).length;

    let overallDirection: "IMPROVING" | "STABLE" | "DETERIORATING";
    if (positiveChanges >= 2) overallDirection = "IMPROVING";
    else if (positiveChanges <= 1) overallDirection = "DETERIORATING";
    else overallDirection = "STABLE";

    return {
      overallDirection,
      keyIndicators,
    };
  }

  private compareTrend(
    recent: number,
    previous: number
  ): "UP" | "DOWN" | "STABLE" {
    const threshold = 0.05; // 5% 변화 임계값
    const change = (recent - previous) / previous;

    if (Math.abs(change) < threshold) return "STABLE";
    return change > 0 ? "UP" : "DOWN";
  }

  private calculateAverageState(
    states: EconomicSystemState[]
  ): EconomicSystemState {
    const count = states.length;

    return {
      totalPmpSupply: states[0].totalPmpSupply, // PmpAmount는 합계만 의미있음
      totalPmcSupply: states[0].totalPmcSupply, // PmcAmount도 합계만 의미있음
      currentEbitRate: states[0].currentEbitRate, // EBIT도 마찬가지
      inflationRate:
        states.reduce((sum, s) => sum + s.inflationRate, 0) / count,
      outputGap: states.reduce((sum, s) => sum + s.outputGap, 0) / count,
      liquidityRatio:
        states.reduce((sum, s) => sum + s.liquidityRatio, 0) / count,
      dailyIssuanceVolume:
        states.reduce((sum, s) => sum + s.dailyIssuanceVolume, 0) / count,
      priceVolatility:
        states.reduce((sum, s) => sum + s.priceVolatility, 0) / count,
      timestamp: new Date(),
    };
  }

  private forecastRisk(
    historicalStates: { timestamp: Date; state: EconomicSystemState }[]
  ) {
    // 단순 선형 추세 기반 예측 (실제로는 더 정교한 모델 사용)
    const recentStates = historicalStates.slice(-7);
    const trends = this.analyzeTrends(historicalStates);

    // 악화 지표 개수에 따른 예측
    const deterioratingCount = trends.keyIndicators.filter(
      (k) =>
        (k.metric === "Liquidity Ratio" && k.trend === "DOWN") ||
        (k.metric !== "Liquidity Ratio" && k.trend === "UP")
    ).length;

    let next7Days = "LOW";
    let next30Days = "LOW";
    let confidence = 0.8;

    if (deterioratingCount >= 2) {
      next7Days = "MEDIUM";
      next30Days = "HIGH";
      confidence = 0.7;
    } else if (deterioratingCount === 1) {
      next7Days = "LOW";
      next30Days = "MEDIUM";
      confidence = 0.75;
    }

    // 변동성이 높으면 신뢰도 감소
    const avgVolatility =
      recentStates.reduce((sum, s) => sum + s.state.priceVolatility, 0) /
      recentStates.length;
    if (avgVolatility > 0.1) {
      confidence *= 0.8;
    }

    return {
      next7Days,
      next30Days,
      confidence,
    };
  }

  private generateTrendBasedRecommendations(
    trendAnalysis: any,
    forecastedRisk: any
  ): string[] {
    const recommendations: string[] = [];

    if (trendAnalysis.overallDirection === "DETERIORATING") {
      recommendations.push(
        "시스템 리스크가 악화되고 있어 예방적 조치가 필요합니다"
      );
      recommendations.push("주요 지표들의 모니터링 빈도를 증가시키세요");
    }

    if (
      forecastedRisk.next7Days === "MEDIUM" ||
      forecastedRisk.next30Days === "HIGH"
    ) {
      recommendations.push(
        "향후 리스크 증가가 예상되므로 사전 대응책을 준비하세요"
      );
    }
    const liquidityTrend = trendAnalysis.keyIndicators.find(
      (k: any) => k.metric === "Liquidity Ratio"
    );
    if (liquidityTrend?.trend === "DOWN") {
      recommendations.push("유동성 확보를 위한 정책적 개입을 고려하세요");
    }

    const inflationTrend = trendAnalysis.keyIndicators.find(
      (k: any) => k.metric === "Inflation Rate"
    );
    if (inflationTrend?.trend === "UP") {
      recommendations.push(
        "인플레이션 압력 완화를 위한 통화정책 조정이 필요합니다"
      );
    }

    if (forecastedRisk.confidence < 0.7) {
      recommendations.push(
        "예측 신뢰도가 낮아 더 많은 데이터 수집이 필요합니다"
      );
    }

    return recommendations;
  }
}
