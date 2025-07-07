/**
 * Economy Risk Management Service
 *
 * Taylor Rule 기반 자동 조절, Circuit Breaker, Mechanism Design Theory 적용
 *
 * 주요 기능:
 * 1. Taylor Rule을 활용한 PMP/PMC 발행량 자동 조절
 * 2. Circuit Breaker를 통한 급격한 시장 변동 방지
 * 3. Mechanism Design Theory 기반 인센티브 구조 최적화
 * 4. 유동성 위험 모니터링 및 관리
 * 5. 인플레이션 위험 감지 및 대응
 * 6. 버블 형성 방지 메커니즘
 */

import { Result } from "@posmul/auth-economy-sdk";

import { EBIT, PMC, PMP } from "../value-objects/economic-types";
import { unwrapPMP } from "../value-objects/economic-value-objects";

/**
 * Taylor Rule 계수 인터페이스
 */
export interface TaylorRuleCoefficients {
  readonly outputGapWeight: number; // 산출 격차에 대한 가중치 (보통 0.5)
  readonly inflationWeight: number; // 인플레이션에 대한 가중치 (보통 1.5)
  readonly naturalRate: number; // 자연금리 (보통 2%)
  readonly targetInflation: number; // 목표 인플레이션율 (보통 2%)
}

/**
 * Circuit Breaker 설정
 */
export interface CircuitBreakerConfig {
  readonly dailyPmpIssuanceLimit: number; // 일일 PMP 발행 한도
  readonly dailyPmcConversionLimit: number; // 일일 PMC 전환 한도
  readonly priceVolatilityThreshold: number; // 가격 변동성 임계값
  readonly liquidityRatioThreshold: number; // 유동성 비율 임계값
  readonly emergencyStopThreshold: number; // 긴급 중단 임계값
}

/**
 * 경제 시스템 현재 상태
 */
export interface EconomicSystemState {
  readonly totalPmpSupply: PMP;
  readonly totalPmcSupply: PMC;
  readonly currentEbitRate: EBIT;
  readonly inflationRate: number;
  readonly outputGap: number;
  readonly liquidityRatio: number;
  readonly dailyIssuanceVolume: number;
  readonly priceVolatility: number;
  readonly timestamp: Date;
}

/**
 * 리스크 레벨 정의
 */
export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

/**
 * 리스크 평가 결과
 */
export interface RiskAssessment {
  readonly overallRisk: RiskLevel;
  readonly liquidityRisk: RiskLevel;
  readonly inflationRisk: RiskLevel;
  readonly bubbleRisk: RiskLevel;
  readonly systemicRisk: RiskLevel;
  readonly recommendations: string[];
  readonly circuitBreakerTriggered: boolean;
  readonly suggestedActions: RiskMitigationAction[];
}

/**
 * 리스크 완화 액션
 */
export interface RiskMitigationAction {
  readonly type:
    | "REDUCE_ISSUANCE"
    | "INCREASE_REQUIREMENTS"
    | "EMERGENCY_STOP"
    | "ADJUST_INCENTIVES";
  readonly severity: number; // 0-1 스케일
  readonly description: string;
  readonly expectedImpact: string;
}

/**
 * Taylor Rule 계산 결과
 */
export interface TaylorRuleResult {
  readonly recommendedInterestRate: number;
  readonly pmpIssuanceAdjustment: number; // -1 to 1 스케일
  readonly pmcConversionAdjustment: number; // -1 to 1 스케일
  readonly reasoning: string;
}

/**
 * 경제 시스템 리스크 관리 서비스
 */
export class RiskManagementService {
  private readonly taylorCoefficients: TaylorRuleCoefficients;
  private readonly circuitBreakerConfig: CircuitBreakerConfig;
  private readonly maxConsecutiveHighRiskDays: number = 3;
  private consecutiveHighRiskDays: number = 0;

  constructor(
    taylorCoefficients?: Partial<TaylorRuleCoefficients>,
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>
  ) {
    // 기본 Taylor Rule 계수 (Bernanke et al., 1999)
    this.taylorCoefficients = {
      outputGapWeight: 0.5,
      inflationWeight: 1.5,
      naturalRate: 0.02,
      targetInflation: 0.02,
      ...taylorCoefficients,
    };

    // 기본 Circuit Breaker 설정
    this.circuitBreakerConfig = {
      dailyPmpIssuanceLimit: 1000000, // 일일 100만 PMP 한도
      dailyPmcConversionLimit: 500000, // 일일 50만 PMC 전환 한도
      priceVolatilityThreshold: 0.15, // 15% 변동성 임계값
      liquidityRatioThreshold: 0.05, // 5% 유동성 비율 하한
      emergencyStopThreshold: 0.25, // 25% 급변동 시 긴급 중단
      ...circuitBreakerConfig,
    };
  }

  /**
   * Taylor Rule을 활용한 통화정책 권고안 계산
   */
  public calculateTaylorRule(
    systemState: EconomicSystemState
  ): Result<TaylorRuleResult> {
    try {
      const { inflationRate, outputGap } = systemState;
      const { outputGapWeight, inflationWeight, naturalRate, targetInflation } =
        this.taylorCoefficients;

      // Taylor Rule: i = r* + π + α(π - π*) + β(y - y*)
      // i: 명목금리, r*: 자연금리, π: 현재 인플레이션, π*: 목표 인플레이션
      // y: 실제 산출, y*: 잠재 산출, α,β: 가중치
      const recommendedRate =
        naturalRate +
        inflationRate +
        inflationWeight * (inflationRate - targetInflation) +
        outputGapWeight * outputGap;

      // PMP 발행량 조절 권고 (-1: 감소, 0: 유지, 1: 증가)
      let pmpAdjustment = 0;
      if (inflationRate > targetInflation + 0.01) {
        pmpAdjustment = -Math.min(1, (inflationRate - targetInflation) * 2);
      } else if (inflationRate < targetInflation - 0.01) {
        pmpAdjustment = Math.min(1, (targetInflation - inflationRate) * 2);
      }

      // PMC 전환 조절 권고
      let pmcAdjustment = 0;
      if (outputGap > 0.02) {
        // 경기 과열
        pmcAdjustment = -Math.min(1, outputGap * 5);
      } else if (outputGap < -0.02) {
        // 경기 침체
        pmcAdjustment = Math.min(1, Math.abs(outputGap) * 5);
      }

      const reasoning = this.generateTaylorRuleReasoning(
        inflationRate,
        outputGap,
        targetInflation,
        recommendedRate
      );

      return {
        success: true,
        data: {
          recommendedInterestRate: Math.max(0, recommendedRate), // 음수 금리 방지
          pmpIssuanceAdjustment: pmpAdjustment,
          pmcConversionAdjustment: pmcAdjustment,
          reasoning,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `Taylor Rule 계산 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }

  /**
   * 종합적인 리스크 평가 수행
   */
  public assessSystemRisk(
    systemState: EconomicSystemState
  ): Result<RiskAssessment> {
    try {
      // 개별 리스크 평가
      const liquidityRisk = this.assessLiquidityRisk(systemState);
      const inflationRisk = this.assessInflationRisk(systemState);
      const bubbleRisk = this.assessBubbleRisk(systemState);
      const systemicRisk = this.assessSystemicRisk(systemState);

      // 전체 리스크 레벨 결정
      const riskLevels = [
        liquidityRisk,
        inflationRisk,
        bubbleRisk,
        systemicRisk,
      ];
      const overallRisk = this.determineOverallRisk(riskLevels);

      // Circuit Breaker 체크
      const circuitBreakerTriggered = this.checkCircuitBreaker(systemState);

      // 연속 고위험 일수 추적
      if (
        overallRisk === RiskLevel.HIGH ||
        overallRisk === RiskLevel.CRITICAL
      ) {
        this.consecutiveHighRiskDays++;
      } else {
        this.consecutiveHighRiskDays = 0;
      }

      // 권고사항 생성
      const recommendations = this.generateRecommendations(
        overallRisk,
        liquidityRisk,
        inflationRisk,
        bubbleRisk,
        systemicRisk
      );

      // 완화 액션 제안
      const suggestedActions = this.generateMitigationActions(
        systemState,
        overallRisk,
        circuitBreakerTriggered
      );

      return {
        success: true,
        data: {
          overallRisk,
          liquidityRisk,
          inflationRisk,
          bubbleRisk,
          systemicRisk,
          recommendations,
          circuitBreakerTriggered,
          suggestedActions,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `리스크 평가 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        ),
      };
    }
  }

  /**
   * Circuit Breaker 동작 여부 확인
   */
  public checkCircuitBreaker(systemState: EconomicSystemState): boolean {
    const { dailyIssuanceVolume, priceVolatility, liquidityRatio } =
      systemState;

    const {
      dailyPmpIssuanceLimit,
      priceVolatilityThreshold,
      liquidityRatioThreshold,
      emergencyStopThreshold,
    } = this.circuitBreakerConfig;

    // 일일 발행량 한도 초과
    if (dailyIssuanceVolume > dailyPmpIssuanceLimit) {
      return true;
    }

    // 가격 변동성 임계값 초과
    if (priceVolatility > priceVolatilityThreshold) {
      return true;
    }

    // 유동성 부족
    if (liquidityRatio < liquidityRatioThreshold) {
      return true;
    }

    // 긴급 중단 조건
    if (priceVolatility > emergencyStopThreshold) {
      return true;
    }

    // 연속 고위험 일수 초과
    if (this.consecutiveHighRiskDays >= this.maxConsecutiveHighRiskDays) {
      return true;
    }

    return false;
  }

  /**
   * Mechanism Design Theory 기반 인센티브 최적화
   */
  public optimizeIncentiveMechanism(
    systemState: EconomicSystemState,
    userBehaviorData: { participationRate: number; averageContribution: number }
  ): Result<{
    adjustedRewardRate: number;
    optimalFeeStructure: number;
    incentiveAlignment: number;
  }> {
    try {
      const { participationRate, averageContribution } = userBehaviorData;

      // Vickrey-Clarke-Groves (VCG) 메커니즘 원리 적용
      // 개인의 진실한 선호 표출을 유도하는 인센티브 설계

      // 참여율 기반 보상 조정
      let adjustedRewardRate = 1.0;
      if (participationRate < 0.3) {
        adjustedRewardRate = 1.5; // 참여 유도를 위한 높은 보상
      } else if (participationRate > 0.8) {
        adjustedRewardRate = 0.8; // 과도한 참여 억제
      }

      // Pigouvian Tax 원리를 적용한 수수료 구조
      const baselineContribution = unwrapPMP(systemState.totalPmpSupply) * 0.01;
      const contributionRatio = averageContribution / baselineContribution;
      const optimalFeeStructure = Math.max(
        0.01,
        0.05 * (2 - contributionRatio)
      );

      // 인센티브 정렬도 측정 (0-1 스케일)
      const incentiveAlignment = Math.min(
        1,
        participationRate * contributionRatio
      );

      return {
        success: true,
        data: {
          adjustedRewardRate,
          optimalFeeStructure,
          incentiveAlignment,
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

  /**
   * 유동성 위험 평가
   */
  private assessLiquidityRisk(systemState: EconomicSystemState): RiskLevel {
    const { liquidityRatio } = systemState;

    if (liquidityRatio < 0.02) return RiskLevel.CRITICAL;
    if (liquidityRatio < 0.05) return RiskLevel.HIGH;
    if (liquidityRatio < 0.1) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * 인플레이션 위험 평가
   */
  private assessInflationRisk(systemState: EconomicSystemState): RiskLevel {
    const { inflationRate } = systemState;
    const { targetInflation } = this.taylorCoefficients;

    const inflationDeviation = Math.abs(inflationRate - targetInflation);

    if (inflationDeviation > 0.05) return RiskLevel.CRITICAL;
    if (inflationDeviation > 0.03) return RiskLevel.HIGH;
    if (inflationDeviation > 0.015) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * 버블 위험 평가
   */
  private assessBubbleRisk(systemState: EconomicSystemState): RiskLevel {
    const { priceVolatility, outputGap } = systemState;

    // 가격 변동성과 실물경제 괴리 기반 버블 위험 측정
    const bubbleIndicator = priceVolatility + Math.abs(outputGap);

    if (bubbleIndicator > 0.3) return RiskLevel.CRITICAL;
    if (bubbleIndicator > 0.2) return RiskLevel.HIGH;
    if (bubbleIndicator > 0.1) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * 시스템 위험 평가
   */
  private assessSystemicRisk(systemState: EconomicSystemState): RiskLevel {
    const { dailyIssuanceVolume } = systemState;
    const { dailyPmpIssuanceLimit } = this.circuitBreakerConfig;

    const issuanceRatio = dailyIssuanceVolume / dailyPmpIssuanceLimit;

    if (issuanceRatio > 0.9) return RiskLevel.CRITICAL;
    if (issuanceRatio > 0.7) return RiskLevel.HIGH;
    if (issuanceRatio > 0.5) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * 전체 리스크 레벨 결정
   */
  private determineOverallRisk(riskLevels: RiskLevel[]): RiskLevel {
    if (riskLevels.includes(RiskLevel.CRITICAL)) return RiskLevel.CRITICAL;
    if (riskLevels.filter((r) => r === RiskLevel.HIGH).length >= 2)
      return RiskLevel.HIGH;
    if (riskLevels.includes(RiskLevel.HIGH)) return RiskLevel.HIGH;
    if (riskLevels.filter((r) => r === RiskLevel.MEDIUM).length >= 3)
      return RiskLevel.HIGH;
    if (riskLevels.includes(RiskLevel.MEDIUM)) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * 권고사항 생성
   */
  private generateRecommendations(
    overall: RiskLevel,
    liquidity: RiskLevel,
    inflation: RiskLevel,
    bubble: RiskLevel,
    systemic: RiskLevel
  ): string[] {
    const recommendations: string[] = [];

    if (overall === RiskLevel.CRITICAL) {
      recommendations.push("긴급 시스템 점검 및 일시적 운영 중단 고려");
    }

    if (liquidity === RiskLevel.HIGH || liquidity === RiskLevel.CRITICAL) {
      recommendations.push("유동성 공급 확대 및 PMC 전환 인센티브 강화");
    }

    if (inflation === RiskLevel.HIGH || inflation === RiskLevel.CRITICAL) {
      recommendations.push("PMP 발행량 축소 및 통화정책 긴축 조치");
    }

    if (bubble === RiskLevel.HIGH || bubble === RiskLevel.CRITICAL) {
      recommendations.push("가격 안정화 메커니즘 활성화 및 투기 거래 억제");
    }

    if (systemic === RiskLevel.HIGH || systemic === RiskLevel.CRITICAL) {
      recommendations.push("시스템 부하 분산 및 확장성 개선");
    }

    return recommendations;
  }

  /**
   * 완화 액션 생성
   */
  private generateMitigationActions(
    systemState: EconomicSystemState,
    overallRisk: RiskLevel,
    circuitBreakerTriggered: boolean
  ): RiskMitigationAction[] {
    const actions: RiskMitigationAction[] = [];

    if (circuitBreakerTriggered) {
      actions.push({
        type: "EMERGENCY_STOP",
        severity: 1.0,
        description: "Circuit Breaker 발동 - 긴급 거래 중단",
        expectedImpact: "시스템 안정성 확보, 일시적 거래 중단",
      });
    }

    if (overallRisk === RiskLevel.HIGH || overallRisk === RiskLevel.CRITICAL) {
      actions.push({
        type: "REDUCE_ISSUANCE",
        severity: 0.8,
        description: "PMP 발행량 50% 감소",
        expectedImpact: "인플레이션 압력 완화, 시장 안정화",
      });

      actions.push({
        type: "INCREASE_REQUIREMENTS",
        severity: 0.6,
        description: "PMC 전환 요구사항 강화",
        expectedImpact: "투기적 거래 억제, 품질 향상",
      });
    }

    if (systemState.liquidityRatio < 0.1) {
      actions.push({
        type: "ADJUST_INCENTIVES",
        severity: 0.7,
        description: "유동성 공급 인센티브 2배 증가",
        expectedImpact: "유동성 확보, 거래 활성화",
      });
    }

    return actions;
  }

  /**
   * Taylor Rule 적용 근거 설명 생성
   */
  private generateTaylorRuleReasoning(
    inflation: number,
    outputGap: number,
    targetInflation: number,
    recommendedRate: number
  ): string {
    const inflationGap = inflation - targetInflation;

    let reasoning = `Taylor Rule 분석: `;

    if (Math.abs(inflationGap) < 0.005) {
      reasoning += `인플레이션이 목표치(${(targetInflation * 100).toFixed(
        1
      )}%)에 근접하여 `;
    } else if (inflationGap > 0) {
      reasoning += `인플레이션이 목표치보다 ${(inflationGap * 100).toFixed(
        1
      )}%p 높아 긴축적 조치가 필요하며 `;
    } else {
      reasoning += `인플레이션이 목표치보다 ${(
        Math.abs(inflationGap) * 100
      ).toFixed(1)}%p 낮아 완화적 조치가 필요하며 `;
    }

    if (Math.abs(outputGap) < 0.01) {
      reasoning += `경제가 잠재성장률 수준에서 운영되고 있습니다.`;
    } else if (outputGap > 0) {
      reasoning += `경제가 과열 상태(+${(outputGap * 100).toFixed(
        1
      )}%)로 냉각이 필요합니다.`;
    } else {
      reasoning += `경제가 침체 상태(${(outputGap * 100).toFixed(
        1
      )}%)로 부양이 필요합니다.`;
    }

    reasoning += ` 권고 금리: ${(recommendedRate * 100).toFixed(2)}%`;

    return reasoning;
  }
}

/**
 * 기본 리스크 관리 서비스 인스턴스 생성 함수
 */
export function createRiskManagementService(
  customTaylorCoefficients?: Partial<TaylorRuleCoefficients>,
  customCircuitBreakerConfig?: Partial<CircuitBreakerConfig>
): RiskManagementService {
  return new RiskManagementService(
    customTaylorCoefficients,
    customCircuitBreakerConfig
  );
}

export default RiskManagementService;
