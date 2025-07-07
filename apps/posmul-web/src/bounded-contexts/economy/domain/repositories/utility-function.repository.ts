/**
 * Utility Function Repository Interface
 *
 * 사용자 개별 효용함수와 사회후생함수 데이터 관리를 위한 리포지토리 인터페이스
 * Behavioral Economics와 Welfare Economics 이론 기반 실시간 효용 추정 시스템
 */

import { UserId } from "@posmul/auth-economy-sdk";

import { Result } from "@posmul/auth-economy-sdk";

import { PMC, PMP } from "../value-objects";

/**
 * 개인 효용함수 매개변수
 * U(x) = α·ln(PMP) + β·ln(PMC) + γ·S(Donate) + δ·Risk_Aversion + ε·Social_Preference
 */
export interface IndividualUtilityParameters {
  readonly userId: UserId;
  readonly alpha: number; // PMP 효용 계수 (위험회피 자산)
  readonly beta: number; // PMC 효용 계수 (위험자산)
  readonly gamma: number; // 사회적 기여(기부) 효용 계수
  readonly delta: number; // 위험회피 성향
  readonly epsilon: number; // 사회적 선호도
  readonly theta: number; // 시간할인율
  readonly rho: number; // 상대위험회피도 (CRRA)
  readonly sigma: number; // 탄력성 대체계수 (CES)
  readonly lastUpdated: Date;
  readonly estimationConfidence: number; // 추정 신뢰도 (0-1)
  readonly dataQuality: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * 사회후생함수 매개변수
 * W = Σᵢ Uᵢ(x) + λ·Gini(distribution) + μ·Social_Mobility + ν·Public_Good
 */
export interface SocialWelfareParameters {
  readonly parameterId: string;
  readonly lambda: number; // 불평등 가중치 (롤스적 정의)
  readonly mu: number; // 사회적 이동성 가중치
  readonly nu: number; // 공공재 가중치
  readonly phi: number; // 집합적 효용 가중치
  readonly psi: number; // 세대간 공정성 가중치
  readonly omega: number; // 환경적 지속가능성 가중치
  readonly calculationDate: Date;
  readonly totalPopulation: number;
  readonly sampleSize: number;
  readonly statisticalSignificance: number;
}

/**
 * 효용함수 추정 입력 데이터
 */
export interface UtilityEstimationInput {
  readonly inputId: string;
  readonly userId: UserId;
  readonly actionType:
    | "PMP_EARN"
    | "PMC_CONVERT"
    | "DONATION"
    | "PREDICTION"
    | "INVESTMENT";
  readonly actionValue: number;
  readonly contextData: {
    readonly pmpBalance: PMP;
    readonly pmcBalance: PMC;
    readonly marketCondition: "BULL" | "BEAR" | "NEUTRAL";
    readonly socialContext: "INDIVIDUAL" | "GROUP" | "COMMUNITY";
    readonly timeOfDay: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
    readonly weekday: boolean;
  };
  readonly satisfactionScore: number; // 사용자 만족도 (1-10)
  readonly regretLevel: number; // 후회 수준 (Kahneman-Tversky)
  readonly timestamp: Date;
}

/**
 * 행동경제학적 바이어스 측정
 */
export interface BehavioralBiasProfile {
  readonly userId: UserId;
  readonly lossAversion: number; // 손실회피 정도
  readonly endowmentEffect: number; // 소유효과
  readonly mentalAccounting: number; // 심리적 회계
  readonly hyperbolicDiscounting: number; // 쌍곡할인
  readonly overconfidence: number; // 과신편향
  readonly anchoring: number; // 앵커링 편향
  readonly availabilityHeuristic: number; // 가용성 휴리스틱
  readonly confirmationBias: number; // 확증편향
  readonly herding: number; // 군집행동
  readonly recentBias: number; // 최신편향
  readonly profileDate: Date;
  readonly reliabilityScore: number;
}

/**
 * 효용함수 예측 결과
 */
export interface UtilityPrediction {
  readonly predictionId: string;
  readonly userId: UserId;
  readonly scenario: {
    readonly pmpAmount: PMP;
    readonly pmcAmount: PMC;
    readonly donationAmount?: PMC;
    readonly riskLevel: number;
  };
  readonly predictedUtility: number;
  readonly confidence: number; // 예측 신뢰도
  readonly confidenceInterval: {
    readonly lower: number;
    readonly upper: number;
    readonly confidence: number;
  };
  readonly marginalUtilities: {
    readonly pmpMarginal: number;
    readonly pmcMarginal: number;
    readonly donationMarginal: number;
  };
  readonly predictionDate: Date;
  readonly validUntil: Date;
}

/**
 * 사회후생 측정 결과
 */
export interface SocialWelfareMeasurement {
  readonly measurementId: string;
  readonly measurementDate: Date;
  readonly aggregateUtility: number;
  readonly giniCoefficient: number;
  readonly socialMobilityIndex: number;
  readonly publicGoodContribution: number;
  readonly inequalityAdjustedWelfare: number;
  readonly rawlsianMaximin: number;
  readonly utilitarianSum: number;
  readonly prioritarianWeighted: number;
  readonly sampleSize: number;
  readonly staticticalPower: number;
}

/**
 * 사회후생 분석 결과
 */
export interface SocialWelfareAnalysis {
  readonly analysisId: string;
  readonly analysisDate: Date;
  readonly aggregateUtility: number;
  readonly inequalityMeasures: {
    readonly giniCoefficient: number;
    readonly athkinsonIndex: number;
    readonly theilIndex: number;
  };
  readonly distributionMetrics: {
    readonly mean: number;
    readonly median: number;
    readonly variance: number;
    readonly skewness: number;
    readonly kurtosis: number;
  };
  readonly socialMobilityIndex: number;
  readonly publicGoodContribution: number;
  readonly welfareImprovementSuggestions: string[];
  readonly confidence: number;
  readonly sampleSize: number;
}

/**
 * 효용함수 최적화 결과
 */
export interface UtilityOptimizationResult {
  readonly optimizationId: string;
  readonly userId: UserId;
  readonly optimizedParameters: IndividualUtilityParameters;
  readonly expectedUtilityImprovement: number;
  readonly optimizationMethod:
    | "GRADIENT_DESCENT"
    | "GENETIC_ALGORITHM"
    | "BAYESIAN_OPTIMIZATION";
  readonly convergenceMetrics: {
    readonly iterations: number;
    readonly convergenceRate: number;
    readonly finalError: number;
  };
  readonly actionRecommendations: {
    readonly pmpAllocation: number;
    readonly pmcAllocation: number;
    readonly donationAmount: number;
    readonly riskProfile: string;
  };
  readonly confidenceInterval: {
    readonly lower: number;
    readonly upper: number;
    readonly confidence: number;
  };
  readonly createdAt: Date;
  readonly validUntil: Date;
}

/**
 * Utility Function Repository 인터페이스
 */
export interface IUtilityFunctionRepository {
  /**
   * 개인 효용함수 매개변수 저장/업데이트
   */
  saveUtilityParameters(
    parameters: IndividualUtilityParameters
  ): Promise<Result<IndividualUtilityParameters>>;

  /**
   * 개인 효용함수 매개변수 조회
   */
  getUtilityParameters(
    userId: UserId
  ): Promise<Result<IndividualUtilityParameters>>;

  /**
   * 여러 사용자 효용함수 매개변수 조회
   */
  getBatchUtilityParameters(
    userIds: UserId[]
  ): Promise<Result<IndividualUtilityParameters[]>>;

  /**
   * 사회후생함수 매개변수 저장
   */
  saveSocialWelfareParameters(
    parameters: Omit<SocialWelfareParameters, "parameterId">
  ): Promise<Result<SocialWelfareParameters>>;

  /**
   * 최신 사회후생함수 매개변수 조회
   */
  getLatestSocialWelfareParameters(): Promise<Result<SocialWelfareParameters>>;

  /**
   * 효용함수 추정 입력 데이터 저장
   */
  saveEstimationInput(
    input: Omit<UtilityEstimationInput, "inputId">
  ): Promise<Result<UtilityEstimationInput>>;

  /**
   * 사용자 행동 데이터 조회 (효용함수 추정용)
   */
  getEstimationInputs(
    userId: UserId,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<Result<UtilityEstimationInput[]>>;

  /**
   * 행동경제학적 바이어스 프로필 저장
   */
  saveBehavioralBiasProfile(
    profile: BehavioralBiasProfile
  ): Promise<Result<BehavioralBiasProfile>>;

  /**
   * 행동경제학적 바이어스 프로필 조회
   */
  getBehavioralBiasProfile(
    userId: UserId
  ): Promise<Result<BehavioralBiasProfile>>;

  /**
   * 효용함수 예측 저장
   */
  saveUtilityPrediction(
    prediction: Omit<UtilityPrediction, "predictionId">
  ): Promise<Result<UtilityPrediction>>;

  /**
   * 효용함수 예측 조회
   */
  getUtilityPredictions(
    userId: UserId,
    validOnly?: boolean
  ): Promise<Result<UtilityPrediction[]>>;

  /**
   * 사회후생 측정 결과 저장
   */
  saveSocialWelfareMeasurement(
    measurement: Omit<SocialWelfareMeasurement, "measurementId">
  ): Promise<Result<SocialWelfareMeasurement>>;

  /**
   * 사회후생 측정 결과 조회
   */
  getSocialWelfareMeasurements(
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<Result<SocialWelfareMeasurement[]>>;

  /**
   * 효용함수 유사도 기반 사용자 클러스터링
   */
  findSimilarUtilityProfiles(
    userId: UserId,
    threshold?: number,
    limit?: number
  ): Promise<
    Result<
      {
        similarUserId: UserId;
        similarity: number;
        parameters: IndividualUtilityParameters;
      }[]
    >
  >;

  /**
   * 집단 효용함수 분석 (세그먼트별)
   */
  getSegmentUtilityAnalysis(segmentCriteria: {
    ageRange?: [number, number];
    pmcBalanceRange?: [PMC, PMC];
    activityLevel?: "HIGH" | "MEDIUM" | "LOW";
    behavioralType?: string;
  }): Promise<
    Result<
      {
        segmentId: string;
        userCount: number;
        avgParameters: Omit<
          IndividualUtilityParameters,
          "userId" | "lastUpdated"
        >;
        parameterVariance: Record<string, number>;
        distinctiveness: number;
      }[]
    >
  >;

  /**
   * 효용함수 변화 추이 분석
   */
  getUtilityTrends(
    userId: UserId,
    startDate: Date,
    endDate: Date
  ): Promise<
    Result<
      {
        timestamp: Date;
        parameters: IndividualUtilityParameters;
        changeRate: Record<string, number>;
      }[]
    >
  >;

  /**
   * 대시보드용 효용함수 요약 통계
   */
  getUtilitySummaryStatistics(): Promise<
    Result<{
      totalUsersWithUtility: number;
      averageConfidence: number;
      mostVolatileParameter: string;
      mostStableParameter: string;
      correlationMatrix: Record<string, Record<string, number>>;
      lastCalculationDate: Date;
    }>
  >;
}
