/**
 * Agency Theory Engine - Domain Service
 * Jensen & Meckling (1976) Agency Theory 기반 PmpAmount→PmcAmount 전환 메커니즘
 *
 * 핵심 개념:
 * - Principal: 국민/시민 (정보 요구자)
 * - Agent: 관료/정치인 (정보 제공자)
 * - Agency Cost: 정보 비대칭으로 인한 사회적 비용
 * - 해결책: 예측 게임을 통한 집단지성 활용
 */

import { Result } from "@posmul/auth-economy-sdk";

import {
  PmcAmount,
  PmpAmount,
  createAgencyCostReduction,
  createAgentAlignmentRatio,
  createInformationAsymmetryScore,
  createPmcAmount,
  unwrapPmpAmount,
} from "../value-objects";
import {
  IAgencyMetrics,
  IAgencyTheoryEngine,
  IConversionResult,
  IEffectivenessResult,
  IPredictionData,
  IPredictionParticipant,
} from "./interfaces/agency-theory.interface";

/**
 * Agency Theory 설정
 */
export interface AgencyTheoryConfig {
  readonly baseConversionRate: number; // 기본 전환율 (예: 0.5)
  readonly maxConversionRate: number; // 최대 전환율 (예: 1.0)
  readonly socialLearningWeight: number; // 사회적 학습 가중치 (0.3)
  readonly accuracyWeight: number; // 예측 정확도 가중치 (0.4)
  readonly transparencyWeight: number; // 정보 투명성 가중치 (0.3)
  readonly agencyCostThreshold: number; // Agency Cost 개선 임계값 (0.7)
}

/**
 * Agency Theory Engine - Domain Service
 * Jensen & Meckling의 Principal-Agent 이론을 실제 코드로 구현
 */
export class AgencyTheoryEngine implements IAgencyTheoryEngine {
  private readonly config: AgencyTheoryConfig;

  constructor(config: AgencyTheoryConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * PmpAmount → PmcAmount 전환 실행
   * Agency Theory 기반 최적 전환율 계산
   *
   * @param pmpAmount - 투입할 PmpAmount 양
   * @param predictionData - 예측 관련 데이터
   * @param participantData - 참여자 데이터
   */ public async convertPmpAmountToPmcAmount(
    pmpAmount: PmpAmount,
    predictionData: IPredictionData,
    participantData: IPredictionParticipant[]
  ): Promise<Result<IConversionResult>> {
    try {
      // 1. Agency Cost 분석
      const agencyMetrics = this.calculateAgencyMetrics(
        predictionData,
        participantData
      );

      // 2. 전환율 계산 (Jensen & Meckling 공식 변형)
      const conversionRate = this.calculateConversionRate(agencyMetrics);

      // 3. 사회적 학습 보너스 계산
      const bonusMultiplier = this.calculateSocialLearningBonus(
        agencyMetrics,
        participantData
      );

      // 4. PmcAmount 산출 계산
      const pmcOutput = this.calculatePmcAmountOutput(
        pmpAmount,
        conversionRate,
        bonusMultiplier
      );

      const result: IConversionResult = {
        pmpInput: pmpAmount,
        pmcOutput,
        conversionRate,
        agencyMetrics,
        bonusMultiplier,
        timestamp: new Date(),
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          "Invalid state"
        ),
      };
    }
  }

  /**
   * Agency Theory 메트릭 계산
   * Principal-Agent 간 정보 비대칭 및 정렬 정도 측정
   */ private calculateAgencyMetrics(
    predictionData: IPredictionData,
    participants: IPredictionParticipant[]
  ): IAgencyMetrics {
    // 정보 비대칭 점수 계산 (낮을수록 좋음)
    const avgAccuracy =
      participants.length > 0
        ? participants.reduce(
            (sum, p) => sum + (p.predictionAccuracy as number),
            0
          ) / participants.length
        : (predictionData.predictionAccuracy as number);

    const informationAsymmetry = createInformationAsymmetryScore(
      1 - avgAccuracy * predictionData.informationTransparency
    );

    // Agent 정렬 비율 계산 (높을수록 좋음)
    const consensusLevel = this.calculateConsensusLevel(participants);
    const agentAlignment = createAgentAlignmentRatio(
      consensusLevel * predictionData.socialLearningIndex
    );

    // Agency Cost 감소율 계산
    const agencyCostReduction = createAgencyCostReduction(
      (predictionData.predictionAccuracy as number) *
        this.config.accuracyWeight +
        predictionData.socialLearningIndex * this.config.socialLearningWeight +
        predictionData.informationTransparency * this.config.transparencyWeight
    );
    return {
      informationAsymmetry: informationAsymmetry as number,
      agentAlignment: agentAlignment as number,
      agencyCostReduction: agencyCostReduction as number,
      predictionAccuracy: predictionData.predictionAccuracy as number,
      socialLearningIndex: predictionData.socialLearningIndex,
      informationTransparency: predictionData.informationTransparency,
    };
  }

  /**
   * 집단 합의 수준 계산
   * 참여자들 간의 예측 일치도 측정
   */
  private calculateConsensusLevel(
    participants: IPredictionParticipant[]
  ): number {
    if (participants.length < 2) return 0.5; // 기본값

    // 각 참여자의 예측 정확도 분산 계산
    const accuracies = participants.map((p) => p.predictionAccuracy as number);
    const mean =
      accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const variance =
      accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) /
      accuracies.length;

    // 분산이 낮을수록 합의도가 높음 (1 - normalized variance)
    const maxVariance = 0.25; // 최대 예상 분산
    const consensusLevel = Math.max(0, 1 - variance / maxVariance);

    return Math.min(1, consensusLevel);
  }

  /**
   * Agency Theory 기반 전환율 계산
   * Jensen & Meckling 공식: Agency Cost가 낮을수록 높은 전환율
   */
  private calculateConversionRate(metrics: IAgencyMetrics): number {
    const { agencyCostReduction, agentAlignment, informationAsymmetry } =
      metrics; // Agency Theory 효율성 지수
    const efficiencyIndex =
      metrics.agencyCostReduction * 0.5 + // Agency Cost 감소의 직접적 영향
      metrics.agentAlignment * 0.3 + // Principal-Agent 정렬
      (1 - metrics.informationAsymmetry) * 0.2; // 정보 대칭성

    // 기본 전환율에 효율성 지수 적용
    const baseRate = this.config.baseConversionRate;
    const maxRate = this.config.maxConversionRate;

    // 비선형 변환: 효율성이 높을수록 급격히 증가
    const conversionRate =
      baseRate + (maxRate - baseRate) * Math.pow(efficiencyIndex, 2);

    return Math.min(maxRate, Math.max(baseRate * 0.1, conversionRate));
  }

  /**
   * 사회적 학습 보너스 계산
   * 집단지성 효과에 따른 추가 보상
   */ private calculateSocialLearningBonus(
    metrics: IAgencyMetrics,
    participants: IPredictionParticipant[]
  ): number {
    const participantCount = participants.length;
    const avgReputation =
      participants.length > 0
        ? participants.reduce((sum, p) => sum + p.reputationScore, 0) /
          participants.length
        : 0.5;

    // 네트워크 효과: 참여자 수에 따른 보너스 (로그 스케일)
    const networkBonus =
      Math.log(Math.max(2, participantCount)) / Math.log(100); // 최대 100명 기준

    // 품질 보너스: 참여자들의 평균 신뢰도
    const qualityBonus = avgReputation;

    // 사회적 학습 보너스
    const socialLearningBonus =
      (metrics.socialLearningIndex * (networkBonus + qualityBonus)) / 2;

    // 기본 1.0에서 최대 2.0까지 보너스
    return 1.0 + Math.min(1.0, socialLearningBonus);
  }

  /**
   * 최종 PmcAmount 산출량 계산
   */
  private calculatePmcAmountOutput(
    pmpInput: PmpAmount,
    conversionRate: number,
    bonusMultiplier: number
  ): PmcAmount {
    const inputAmount = unwrapPmpAmount(pmpInput);
    const outputAmount = inputAmount * conversionRate * bonusMultiplier;

    return createPmcAmount(outputAmount);
  }

  /**
   * Agency Cost 개선 권장사항 생성
   */ public generateImprovementRecommendations(
    metrics: IAgencyMetrics
  ): string[] {
    const recommendations: string[] = []; // 정보 비대칭 개선
    if (metrics.informationAsymmetry > 0.6) {
      recommendations.push(
        "정보 투명성 향상을 위해 더 많은 데이터 공개 필요",
        "예측 게임 참여자 수 확대로 집단지성 효과 증대",
        "전문가 의견과 시민 의견의 균형있는 반영"
      );
    }

    // Agent 정렬 개선
    if (metrics.agentAlignment < 0.5) {
      recommendations.push(
        "정책 결정 과정에 시민 직접 참여 확대",
        "예측 정확도 기반 인센티브 시스템 강화",
        "관료와 시민 간 소통 채널 개선"
      );
    }

    // Agency Cost 감소 권장
    if (metrics.agencyCostReduction < this.config.agencyCostThreshold) {
      recommendations.push(
        "예측 게임의 다양성 증대로 학습 효과 극대화",
        "실시간 피드백 시스템 도입",
        "장기적 성과 추적 및 보상 체계 구축"
      );
    }

    return recommendations;
  }

  /**
   * 설정 유효성 검증
   */
  private validateConfig(): void {
    const {
      baseConversionRate,
      maxConversionRate,
      socialLearningWeight,
      accuracyWeight,
      transparencyWeight,
    } = this.config;

    if (baseConversionRate < 0 || baseConversionRate > maxConversionRate) {
      throw new Error("Invalid baseConversionRate");
    }

    if (maxConversionRate > 2.0) {
      throw new Error("maxConversionRate should not exceed 2.0");
    }

    const totalWeight =
      socialLearningWeight + accuracyWeight + transparencyWeight;
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error("Weight sum should equal 1.0");
    }
  }

  /**
   * Agency Theory 효과성 측정
   * 시간에 따른 Agency Cost 변화 추적
   */ public measureEffectiveness(
    historicalMetrics: IAgencyMetrics[],
    timeWindow: number = 30 // 일 단위
  ): IEffectivenessResult {
    if (historicalMetrics.length < 2) {
      return {
        agencyCostTrend: 0,
        informationSymmetryImprovement: 0,
        participationGrowthRate: 0,
        overallEffectiveness: 0.5,
      };
    }

    const recent = historicalMetrics.slice(-timeWindow);
    const early = historicalMetrics.slice(0, timeWindow); // Agency Cost 개선 추세 (값이 클수록 좋음)
    const recentAvgReduction =
      recent.reduce((sum, m) => sum + m.agencyCostReduction, 0) / recent.length;
    const earlyAvgReduction =
      early.reduce((sum, m) => sum + m.agencyCostReduction, 0) / early.length;
    const agencyCostTrend = recentAvgReduction - earlyAvgReduction;

    // 정보 대칭성 개선 (비대칭이 감소하면 개선)
    const recentAvgAsymmetry =
      recent.reduce((sum, m) => sum + m.informationAsymmetry, 0) /
      recent.length;
    const earlyAvgAsymmetry =
      early.reduce((sum, m) => sum + m.informationAsymmetry, 0) / early.length;
    const informationSymmetryImprovement =
      earlyAvgAsymmetry - recentAvgAsymmetry;

    // 참여 증가율 (social learning index 증가로 측정)
    const recentAvgSocial =
      recent.reduce((sum, m) => sum + m.socialLearningIndex, 0) / recent.length;
    const earlyAvgSocial =
      early.reduce((sum, m) => sum + m.socialLearningIndex, 0) / early.length;
    const participationGrowthRate =
      earlyAvgSocial > 0
        ? (recentAvgSocial - earlyAvgSocial) / earlyAvgSocial
        : 0;

    // 종합 효과성 계산
    const overallEffectiveness = Math.max(
      0,
      Math.min(
        1,
        (0.4 * (agencyCostTrend + 1)) / 2 + // Agency Cost 개선도
          (0.3 * (informationSymmetryImprovement + 1)) / 2 + // 정보 대칭성 개선도
          0.3 * Math.min(1, participationGrowthRate) // 참여 증가율
      )
    );

    return {
      agencyCostTrend,
      informationSymmetryImprovement,
      participationGrowthRate,
      overallEffectiveness,
    };
  }
}
