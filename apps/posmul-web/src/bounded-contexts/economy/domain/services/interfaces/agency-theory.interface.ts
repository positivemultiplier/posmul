/**
 * Agency Theory Engine - Domain Service Interface
 * Jensen & Meckling (1976) Agency Theory 추상화 인터페이스
 *
 * DDD 원칙에 따라 구현체와 인터페이스 분리
 */

import { Result } from "@posmul/shared-types";
import { PMC, PMP, PredictionAccuracy } from "../../value-objects";

/**
 * Agency Theory 메트릭 인터페이스
 */
export interface IAgencyMetrics {
  readonly informationAsymmetry: number;
  readonly agentAlignment: number;
  readonly agencyCostReduction: number;
  readonly predictionAccuracy: number;
  readonly socialLearningIndex: number;
  readonly informationTransparency: number;
}

/**
 * PMP→PMC 전환 결과 인터페이스
 */
export interface IConversionResult {
  readonly pmpInput: PMP;
  readonly pmcOutput: PMC;
  readonly conversionRate: number;
  readonly agencyMetrics: IAgencyMetrics;
  readonly bonusMultiplier: number;
  readonly timestamp: Date;
}

/**
 * 예측 게임 참여자 인터페이스
 */
export interface IPredictionParticipant {
  readonly userId: string;
  readonly predictionAccuracy: PredictionAccuracy;
  readonly participationCount: number;
  readonly consensusContribution: number;
  readonly reputationScore: number;
}

/**
 * 예측 데이터 인터페이스
 */
export interface IPredictionData {
  readonly predictionAccuracy: PredictionAccuracy;
  readonly socialLearningIndex: number;
  readonly informationTransparency: number;
}

/**
 * Agency Theory 효과성 측정 결과
 */
export interface IEffectivenessResult {
  readonly agencyCostTrend: number;
  readonly informationSymmetryImprovement: number;
  readonly participationGrowthRate: number;
  readonly overallEffectiveness: number;
}

/**
 * Agency Theory Engine 도메인 서비스 인터페이스
 *
 * 책임:
 * - PMP → PMC 전환 메커니즘 제공
 * - Agency Cost 계산 및 최적화
 * - 정보 비대칭 극복 알고리즘
 * - 사회적 학습 효과 측정
 */
export interface IAgencyTheoryEngine {
  /**
   * PMP → PMC 전환 실행
   * @param pmpAmount 투입할 PMP 양
   * @param predictionData 예측 관련 데이터
   * @param participantData 참여자 데이터
   */
  convertPMPToPMC(
    pmpAmount: PMP,
    predictionData: IPredictionData,
    participantData: IPredictionParticipant[]
  ): Promise<Result<IConversionResult>>;

  /**
   * Agency Cost 개선 권장사항 생성
   * @param metrics Agency 메트릭
   */
  generateImprovementRecommendations(metrics: IAgencyMetrics): string[];

  /**
   * Agency Theory 효과성 측정
   * @param historicalMetrics 과거 메트릭 데이터
   * @param timeWindow 측정 기간 (일 단위)
   */
  measureEffectiveness(
    historicalMetrics: IAgencyMetrics[],
    timeWindow?: number
  ): IEffectivenessResult;
}
