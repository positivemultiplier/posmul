/**
 * Economic Analytics Repository Interface
 *
 * 경제 시스템의 핵심 지표, 실시간 분석, 계량경제학적 모델링을 위한 리포지토리 인터페이스
 * 실증분석, A/B 테스트, 정책 효과성 측정을 위한 데이터 관리
 */

import { UserId } from "@posmul/auth-economy-sdk";

import { Result } from "@posmul/auth-economy-sdk";

import { PMC, PMP } from "../value-objects";

/**
 * 거시경제 지표
 */
export interface MacroeconomicIndicators {
  readonly indicatorId: string;
  readonly measurementDate: Date;
  readonly pmpCirculation: PMP;
  readonly pmcCirculation: PMC;
  readonly velocityOfMoney: number;
  readonly inflationRate: number;
  readonly giniCoefficient: number;
  readonly unemploymentRate: number;
  readonly gdpGrowthRate: number;
  readonly socialWelfareIndex: number;
  readonly networkEffectIndex: number;
  readonly liquidityRatio: number;
}

/**
 * 미시경제 지표
 */
export interface MicroeconomicIndicators {
  readonly indicatorId: string;
  readonly measurementDate: Date;
  readonly averageUtilityScore: number;
  readonly consumerSurplus: number;
  readonly producerSurplus: number;
  readonly marketEfficiency: number;
  readonly priceElasticity: number;
  readonly demandElasticity: number;
  readonly substitutionEffect: number;
  readonly incomeEffect: number;
  readonly welfareDeadweight: number;
  readonly marginalCostBenefit: number;
}

/**
 * A/B 테스트 설정
 */
export interface ABTestConfiguration {
  readonly testId: string;
  readonly testName: string;
  readonly hypothesis: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly controlGroup: {
    readonly userIds: UserId[];
    readonly treatment: "CONTROL";
    readonly parameters: Record<string, any>;
  };
  readonly treatmentGroups: {
    readonly groupId: string;
    readonly userIds: UserId[];
    readonly treatment: string;
    readonly parameters: Record<string, any>;
  }[];
  readonly successMetrics: string[];
  readonly significanceLevel: number;
  readonly minimumSampleSize: number;
  readonly status: "PLANNING" | "RUNNING" | "COMPLETED" | "CANCELLED";
}

/**
 * A/B 테스트 결과
 */
export interface ABTestResult {
  readonly testId: string;
  readonly resultId: string;
  readonly analysisDate: Date;
  readonly controlMetrics: Record<string, number>;
  readonly treatmentMetrics: Record<
    string,
    {
      groupId: string;
      values: Record<string, number>;
      statisticalSignificance: number;
      pValue: number;
      confidenceInterval: [number, number];
      effectSize: number;
    }
  >;
  readonly overallConclusion:
    | "SIGNIFICANT_POSITIVE"
    | "SIGNIFICANT_NEGATIVE"
    | "NO_EFFECT"
    | "INCONCLUSIVE";
  readonly recommendations: string[];
  readonly economicImpact: {
    readonly welfareChange: number;
    readonly efficiencyGain: number;
    readonly distributionalEffect: number;
  };
}

/**
 * 패널 데이터 관찰
 */
export interface PanelDataObservation {
  readonly observationId: string;
  readonly userId: UserId;
  readonly timeperiod: number;
  readonly dependent: Record<string, number>; // 종속변수들
  readonly independent: Record<string, number>; // 독립변수들
  readonly controls: Record<string, number>; // 통제변수들
  readonly instruments: Record<string, number>; // 도구변수들
  readonly weights: number; // 가중치
  readonly clusters: string[]; // 클러스터 변수
  readonly observationDate: Date;
}

/**
 * 계량경제학 모델 결과
 */
export interface EconometricModelResult {
  readonly modelId: string;
  readonly modelType:
    | "OLS"
    | "FIXED_EFFECTS"
    | "RANDOM_EFFECTS"
    | "IV"
    | "PANEL_VAR"
    | "DIFF_IN_DIFF";
  readonly specification: string;
  readonly estimationDate: Date;
  readonly coefficients: Record<
    string,
    {
      readonly estimate: number;
      readonly standardError: number;
      readonly tStatistic: number;
      readonly pValue: number;
      readonly confidenceInterval: [number, number];
    }
  >;
  readonly modelFit: {
    readonly rSquared: number;
    readonly adjustedRSquared: number;
    readonly fStatistic: number;
    readonly aicScore: number;
    readonly bicScore: number;
    readonly logLikelihood: number;
  };
  readonly diagnostics: {
    readonly heteroscedasticity: number;
    readonly autocorrelation: number;
    readonly multicollinearity: number;
    readonly endogeneity: number;
  };
  readonly economicInterpretation: {
    readonly elasticities: Record<string, number>;
    readonly marginalEffects: Record<string, number>;
    readonly policyImplications: string[];
  };
}

/**
 * 시장 실패 감지
 */
export interface MarketFailureDetection {
  readonly detectionId: string;
  readonly detectionDate: Date;
  readonly failureType:
    | "MONOPOLY"
    | "EXTERNALITY"
    | "PUBLIC_GOODS"
    | "INFORMATION_ASYMMETRY"
    | "BUBBLE"
    | "LIQUIDITY_CRISIS";
  readonly severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  readonly affectedMarkets: string[];
  readonly indicators: Record<string, number>;
  readonly rootCauses: string[];
  readonly recommendedActions: {
    readonly action: string;
    readonly priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    readonly estimatedCost: PMC;
    readonly expectedBenefit: number;
  }[];
  readonly automaticResponses: string[];
}

/**
 * 정책 시뮬레이션 결과
 */
export interface PolicySimulationResult {
  readonly simulationId: string;
  readonly policyName: string;
  readonly simulationDate: Date;
  readonly scenario: {
    readonly baseline: Record<string, number>;
    readonly proposed: Record<string, number>;
    readonly assumptions: Record<string, any>;
  };
  readonly results: {
    readonly shortTerm: Record<string, number>;
    readonly mediumTerm: Record<string, number>;
    readonly longTerm: Record<string, number>;
  };
  readonly welfare: {
    readonly utilitarian: number;
    readonly rawlsian: number;
    readonly prioritarian: number;
    readonly sufficientarian: number;
  };
  readonly distributional: {
    readonly giniChange: number;
    readonly topDecileShare: number;
    readonly bottomDecileShare: number;
    readonly middleClassEffect: number;
  };
  readonly uncertainty: {
    readonly confidenceLevel: number;
    readonly sensitivityAnalysis: Record<string, number>;
    readonly robustnessChecks: string[];
  };
}

/**
 * Economic Analytics Repository 인터페이스
 */
export interface IEconomicAnalyticsRepository {
  /**
   * 거시경제 지표 저장
   */
  saveMacroeconomicIndicators(
    indicators: Omit<MacroeconomicIndicators, "indicatorId">
  ): Promise<Result<MacroeconomicIndicators>>;

  /**
   * 거시경제 지표 조회
   */
  getMacroeconomicIndicators(
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<Result<MacroeconomicIndicators[]>>;

  /**
   * 미시경제 지표 저장
   */
  saveMicroeconomicIndicators(
    indicators: Omit<MicroeconomicIndicators, "indicatorId">
  ): Promise<Result<MicroeconomicIndicators>>;

  /**
   * 미시경제 지표 조회
   */
  getMicroeconomicIndicators(
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<Result<MicroeconomicIndicators[]>>;

  /**
   * A/B 테스트 설정 저장
   */
  saveABTestConfiguration(
    config: ABTestConfiguration
  ): Promise<Result<ABTestConfiguration>>;

  /**
   * A/B 테스트 결과 저장
   */
  saveABTestResult(
    result: Omit<ABTestResult, "resultId">
  ): Promise<Result<ABTestResult>>;

  /**
   * 활성 A/B 테스트 조회
   */
  getActiveABTests(): Promise<Result<ABTestConfiguration[]>>;

  /**
   * A/B 테스트 결과 조회
   */
  getABTestResults(testId: string): Promise<Result<ABTestResult[]>>;

  /**
   * 패널 데이터 저장
   */
  savePanelDataObservation(
    observation: Omit<PanelDataObservation, "observationId">
  ): Promise<Result<PanelDataObservation>>;

  /**
   * 패널 데이터 조회 (계량경제학 분석용)
   */
  getPanelData(
    userIds?: UserId[],
    startPeriod?: number,
    endPeriod?: number,
    variables?: string[]
  ): Promise<Result<PanelDataObservation[]>>;

  /**
   * 계량경제학 모델 결과 저장
   */
  saveEconometricModelResult(
    result: Omit<EconometricModelResult, "modelId">
  ): Promise<Result<EconometricModelResult>>;

  /**
   * 계량경제학 모델 결과 조회
   */
  getEconometricModelResults(
    modelType?: EconometricModelResult["modelType"],
    startDate?: Date,
    endDate?: Date
  ): Promise<Result<EconometricModelResult[]>>;

  /**
   * 시장 실패 감지 결과 저장
   */
  saveMarketFailureDetection(
    detection: Omit<MarketFailureDetection, "detectionId">
  ): Promise<Result<MarketFailureDetection>>;

  /**
   * 시장 실패 감지 결과 조회
   */
  getMarketFailureDetections(
    failureType?: MarketFailureDetection["failureType"],
    severity?: MarketFailureDetection["severity"],
    startDate?: Date,
    endDate?: Date
  ): Promise<Result<MarketFailureDetection[]>>;

  /**
   * 정책 시뮬레이션 결과 저장
   */
  savePolicySimulationResult(
    result: Omit<PolicySimulationResult, "simulationId">
  ): Promise<Result<PolicySimulationResult>>;

  /**
   * 정책 시뮬레이션 결과 조회
   */
  getPolicySimulationResults(
    policyName?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Result<PolicySimulationResult[]>>;

  /**
   * 실시간 경제 지표 대시보드 데이터
   */
  getRealtimeDashboardData(): Promise<
    Result<{
      currentIndicators: {
        macro: MacroeconomicIndicators;
        micro: MicroeconomicIndicators;
      };
      recentTrends: {
        pmpGrowthRate: number;
        pmcVolatility: number;
        welfareChange: number;
        inequalityChange: number;
      };
      alerts: {
        marketFailures: MarketFailureDetection[];
        abTestResults: ABTestResult[];
        significantChanges: string[];
      };
      predictions: {
        nextPeriodForecasts: Record<string, number>;
        confidenceIntervals: Record<string, [number, number]>;
        riskFactors: string[];
      };
    }>
  >;

  /**
   * 커스텀 경제 분석 쿼리 실행
   */
  executeCustomAnalysis(
    analysisType:
      | "CORRELATION"
      | "REGRESSION"
      | "TIME_SERIES"
      | "CAUSALITY"
      | "FORECAST",
    parameters: Record<string, any>
  ): Promise<
    Result<{
      analysisId: string;
      results: Record<string, any>;
      interpretation: string[];
      limitations: string[];
      recommendations: string[];
    }>
  >;

  /**
   * 벤치마크 경제 지표와 비교
   */
  compareToBenchmarks(
    benchmarkType:
      | "HISTORICAL"
      | "THEORETICAL"
      | "PEER_PLATFORMS"
      | "NATIONAL_ECONOMY",
    metrics: string[]
  ): Promise<
    Result<{
      comparisons: Record<
        string,
        {
          ourValue: number;
          benchmarkValue: number;
          difference: number;
          percentageDifference: number;
          interpretation: string;
        }
      >;
      overallPerformance:
        | "ABOVE_BENCHMARK"
        | "AT_BENCHMARK"
        | "BELOW_BENCHMARK";
      improvementAreas: string[];
    }>
  >;
}
