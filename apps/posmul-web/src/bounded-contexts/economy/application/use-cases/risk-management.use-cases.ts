/**
 * Risk Management Use Cases
 * 리스크 관리 관련 Use Case들
 */

import { Result, isFailure } from "@posmul/auth-economy-sdk";

import {
  EconomicSystemState,
  RiskAssessment,
  RiskManagementService,
} from "../../domain/services";

/**
 * 시스템 안정성 모니터링 Use Case
 */
export class MonitorSystemStabilityUseCase {
  constructor(private readonly riskManagementService: RiskManagementService) {}

  

  async execute(systemState: EconomicSystemState): Promise<
    Result<{
      riskAssessment: RiskAssessment;
      isStable: boolean;
      immediateActions: string[];
    }>
  > {
    try {
      // 리스크 평가 수행
      const riskResult =
        this.riskManagementService.assessSystemRisk(systemState);

      if (!riskResult.success) {
        return {
          success: false,
          error: isFailure(riskResult) ? riskResult.error : new Error("Unknown error"),
        };
      }

      const riskAssessment = riskResult.data;

      // 시스템 안정성 판단
      const isStable =
        riskAssessment.overallRisk === "LOW" ||
        riskAssessment.overallRisk === "MEDIUM";

      // 즉시 실행할 액션들 추출
      const immediateActions = riskAssessment.suggestedActions
        .filter((action) => action.severity > 0.7)
        .map((action) => action.description);

      return {
        success: true,
        data: {
          riskAssessment,
          isStable,
          immediateActions,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `시스템 안정성 모니터링 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }
}

/**
 * 자동 경제 정책 조정 Use Case
 */
export class AutoEconomicPolicyAdjustmentUseCase {
  constructor(private readonly riskManagementService: RiskManagementService) {}

  

  async execute(systemState: EconomicSystemState): Promise<
    Result<{
      adjustments: {
        pmpIssuanceChange: number;
        pmcConversionChange: number;
        recommendedInterestRate: number;
      };
      reasoning: string;
      urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    }>
  > {
    try {
      // Taylor Rule 계산
      const taylorResult =
        this.riskManagementService.calculateTaylorRule(systemState);

      if (!taylorResult.success) {
        return {
          success: false,
          error: isFailure(taylorResult) ? taylorResult.error : new Error("Unknown error"),
        };
      }

      const taylorData = taylorResult.data;

      // 리스크 평가로 긴급도 결정
      const riskResult =
        this.riskManagementService.assessSystemRisk(systemState);
      if (!riskResult.success) {
        return {
          success: false,
          error: isFailure(riskResult) ? riskResult.error : new Error("Unknown error"),
        };
      }

      const urgency = this.mapRiskLevelToUrgency(riskResult.data.overallRisk);

      return {
        success: true,
        data: {
          adjustments: {
            pmpIssuanceChange: taylorData.pmpIssuanceAdjustment,
            pmcConversionChange: taylorData.pmcConversionAdjustment,
            recommendedInterestRate: taylorData.recommendedInterestRate,
          },
          reasoning: taylorData.reasoning,
          urgency,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `자동 경제 정책 조정 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }

  private mapRiskLevelToUrgency(
    riskLevel: string
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    switch (riskLevel) {
      case "LOW":
        return "LOW";
      case "MEDIUM":
        return "MEDIUM";
      case "HIGH":
        return "HIGH";
      case "CRITICAL":
        return "CRITICAL";
      default:
        return "MEDIUM";
    }
  }
}

/**
 * 긴급 Circuit Breaker 실행 Use Case
 */
export class EmergencyCircuitBreakerUseCase {
  constructor(private readonly riskManagementService: RiskManagementService) {}

  

  async execute(systemState: EconomicSystemState): Promise<
    Result<{
      circuitBreakerActivated: boolean;
      reason: string;
      expectedDuration: number; // 분 단위
      emergencyActions: string[];
    }>
  > {
    try {
      // Circuit Breaker 체크
      const shouldActivate =
        this.riskManagementService.checkCircuitBreaker(systemState);

      if (!shouldActivate) {
        return {
          success: true,
          data: {
            circuitBreakerActivated: false,
            reason: "정상 범위 내 운영 중",
            expectedDuration: 0,
            emergencyActions: [],
          },
        };
      }

      // 활성화 이유 분석
      const reason = this.analyzeCircuitBreakerReason(systemState);

      // 예상 복구 시간 계산 (리스크 정도에 따라)
      const expectedDuration = this.calculateRecoveryTime(systemState);

      // 긴급 액션 목록
      const emergencyActions = [
        "모든 신규 PmpAmount 발행 중단",
        "대량 PmcAmount 전환 요청 보류",
        "시스템 관리자 긴급 알림",
        "사용자 공지사항 발송",
        "백업 시스템 준비",
      ];

      return {
        success: true,
        data: {
          circuitBreakerActivated: true,
          reason,
          expectedDuration,
          emergencyActions,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `Circuit Breaker 실행 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }

  private analyzeCircuitBreakerReason(
    systemState: EconomicSystemState
  ): string {
    const reasons: string[] = [];

    if (systemState.priceVolatility > 0.15) {
      reasons.push(
        `가격 변동성 과도 (${(systemState.priceVolatility * 100).toFixed(1)}%)`
      );
    }

    if (systemState.liquidityRatio < 0.05) {
      reasons.push(
        `유동성 부족 (${(systemState.liquidityRatio * 100).toFixed(1)}%)`
      );
    }

    if (systemState.dailyIssuanceVolume > 1000000) {
      reasons.push(
        `일일 발행량 초과 (${systemState.dailyIssuanceVolume.toLocaleString()})`
      );
    }

    return reasons.length > 0 ? reasons.join(", ") : "복합적 리스크 요인";
  }

  private calculateRecoveryTime(systemState: EconomicSystemState): number {
    // 기본 30분, 리스크 정도에 따라 조정
    let baseTime = 30;

    if (systemState.priceVolatility > 0.25) baseTime += 60;
    if (systemState.liquidityRatio < 0.02) baseTime += 120;
    if (systemState.inflationRate > 0.1) baseTime += 90;

    return Math.min(baseTime, 480); // 최대 8시간
  }
}

/**
 * 인센티브 메커니즘 최적화 Use Case
 */
export class OptimizeIncentiveMechanismUseCase {
  constructor(private readonly riskManagementService: RiskManagementService) {}

  

  async execute(
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
      // 기본 인센티브 최적화
      const optimizationResult =
        this.riskManagementService.optimizeIncentiveMechanism(systemState, {
          participationRate: userBehaviorData.participationRate,
          averageContribution: userBehaviorData.averageContribution,
        });

      if (!optimizationResult.success) {
        return {
          success: false,
          error: isFailure(optimizationResult) ? optimizationResult.error : new Error("Unknown error"),
        };
      }

      const optimizedIncentives = optimizationResult.data;

      // 예상 효과 계산
      const expectedImpact = this.calculateExpectedImpact(
        userBehaviorData,
        optimizedIncentives
      );

      // 구현 계획 생성
      const implementationPlan = this.generateImplementationPlan(
        optimizedIncentives,
        userBehaviorData
      );

      return {
        success: true,
        data: {
          optimizedIncentives: {
            rewardRate: optimizedIncentives.adjustedRewardRate,
            feeStructure: optimizedIncentives.optimalFeeStructure,
            alignmentScore: optimizedIncentives.incentiveAlignment,
          },
          expectedImpact,
          implementationPlan,
        },
      };
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

  private calculateExpectedImpact(
    current: {
      participationRate: number;
      averageContribution: number;
      engagementScore: number;
    },
    optimized: {
      adjustedRewardRate: number;
      optimalFeeStructure: number;
      incentiveAlignment: number;
    }
  ) {
    // 간단한 선형 모델로 예상 효과 계산
    const rewardImpact = (optimized.adjustedRewardRate - 1.0) * 0.5;
    const feeImpact = (0.05 - optimized.optimalFeeStructure) * 0.3;
    const alignmentImpact = optimized.incentiveAlignment * 0.2;

    return {
      participationIncrease: Math.max(0, rewardImpact + alignmentImpact),
      contributionIncrease: Math.max(0, rewardImpact + feeImpact),
      stabilityImprovement: optimized.incentiveAlignment * 0.15,
    };
  }

  private generateImplementationPlan(
    optimized: {
      adjustedRewardRate: number;
      optimalFeeStructure: number;
      incentiveAlignment: number;
    },
    current: { participationRate: number; userCount: number }
  ): string[] {
    const plan: string[] = [];

    // 보상율 조정
    if (optimized.adjustedRewardRate !== 1.0) {
      plan.push(
        `보상율을 ${(optimized.adjustedRewardRate * 100).toFixed(0)}%로 조정`
      );
    }

    // 수수료 구조 변경
    plan.push(
      `수수료 구조를 ${(optimized.optimalFeeStructure * 100).toFixed(
        1
      )}%로 설정`
    );

    // 단계별 적용
    if (current.userCount > 10000) {
      plan.push("A/B 테스트를 통한 단계적 적용 (20% 사용자 대상)");
      plan.push("2주간 효과 모니터링 후 전체 적용");
    } else {
      plan.push("즉시 전체 사용자에게 적용");
    }

    // 모니터링
    plan.push("일일 참여율 및 기여도 지표 모니터링");
    plan.push("주간 인센티브 효과성 리포트 생성");

    return plan;
  }
}
