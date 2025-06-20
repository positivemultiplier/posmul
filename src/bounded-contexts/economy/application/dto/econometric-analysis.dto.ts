/**
 * @fileoverview 실증분석 관련 DTO(Data Transfer Objects)
 * @description A/B 테스트, 회귀분석, 패널데이터 분석 등을 위한 데이터 전송 객체들
 * @author Economy Domain - Application Layer
 * @version 1.0.0
 */

import { z } from "zod";

// ===========================================
// A/B Testing DTOs
// ===========================================

/**
 * A/B 테스트 설계 요청 DTO
 */
export const ABTestDesignRequestSchema = z.object({
  testName: z.string().min(1, "A/B 테스트 이름은 필수입니다"),
  description: z.string().optional(),
  primaryMetric: z.string().min(1, "주요 지표는 필수입니다"),
  secondaryMetrics: z.array(z.string()).optional().default([]),
  minimumDetectableEffect: z
    .number()
    .positive("최소 탐지 효과는 양수여야 합니다"),
  significanceLevel: z.number().min(0.001).max(0.1).default(0.05),
  statisticalPower: z.number().min(0.5).max(0.99).default(0.8),
  trafficSplitRatio: z.number().min(0.1).max(0.9).default(0.5),
  estimatedBaselineConversionRate: z.number().min(0).max(1).optional(),
  testDurationDays: z.number().int().positive().optional(),
  stratificationVariables: z.array(z.string()).optional().default([]),
});

export type ABTestDesignRequest = z.infer<typeof ABTestDesignRequestSchema>;

/**
 * A/B 테스트 설계 응답 DTO
 */
export const ABTestDesignResponseSchema = z.object({
  testId: z.string(),
  requiredSampleSize: z.number(),
  controlGroupSize: z.number(),
  treatmentGroupSize: z.number(),
  estimatedTestDuration: z.number(),
  powerAnalysis: z.object({
    alpha: z.number(),
    beta: z.number(),
    power: z.number(),
    effectSize: z.number(),
  }),
  recommendations: z.array(z.string()),
});

export type ABTestDesignResponse = z.infer<typeof ABTestDesignResponseSchema>;

/**
 * A/B 테스트 분석 요청 DTO
 */
export const ABTestAnalysisRequestSchema = z.object({
  testId: z.string().min(1, "테스트 ID는 필수입니다"),
  controlGroupData: z.array(
    z.object({
      userId: z.string(),
      metric: z.string(),
      value: z.number(),
      timestamp: z.string().datetime(),
      covariates: z.record(z.string(), z.number()).optional(),
    })
  ),
  treatmentGroupData: z.array(
    z.object({
      userId: z.string(),
      metric: z.string(),
      value: z.number(),
      timestamp: z.string().datetime(),
      covariates: z.record(z.string(), z.number()).optional(),
    })
  ),
  analysisType: z.enum(["frequentist", "bayesian", "both"]).default("both"),
  confidenceLevel: z.number().min(0.9).max(0.99).default(0.95),
  includeSegmentAnalysis: z.boolean().default(false),
  segmentationVariables: z.array(z.string()).optional(),
});

export type ABTestAnalysisRequest = z.infer<typeof ABTestAnalysisRequestSchema>;

/**
 * A/B 테스트 분석 응답 DTO
 */
export const ABTestAnalysisResponseSchema = z.object({
  testId: z.string(),
  overallResults: z.object({
    controlMean: z.number(),
    treatmentMean: z.number(),
    absoluteEffect: z.number(),
    relativeEffect: z.number(),
    pValue: z.number(),
    confidenceInterval: z.tuple([z.number(), z.number()]),
    isStatisticallySignificant: z.boolean(),
    isPracticallySignificant: z.boolean(),
  }),
  frequentistResults: z.object({
    tStatistic: z.number(),
    degreesOfFreedom: z.number(),
    effectSize: z.number(),
    welchTest: z.object({
      statistic: z.number(),
      pValue: z.number(),
    }),
    mannWhitneyU: z.object({
      statistic: z.number(),
      pValue: z.number(),
    }),
  }),
  bayesianResults: z.object({
    posteriorProbabilityOfSuperiority: z.number(),
    expectedLoss: z.number(),
    credibleInterval: z.tuple([z.number(), z.number()]),
    probabilityOfPracticalSignificance: z.number(),
  }),
  segmentAnalysis: z
    .array(
      z.object({
        segmentName: z.string(),
        segmentValue: z.string(),
        controlMean: z.number(),
        treatmentMean: z.number(),
        effect: z.number(),
        pValue: z.number(),
        sampleSize: z.number(),
      })
    )
    .optional(),
  recommendations: z.array(z.string()),
});

export type ABTestAnalysisResponse = z.infer<
  typeof ABTestAnalysisResponseSchema
>;

// ===========================================
// Regression Analysis DTOs
// ===========================================

/**
 * 회귀분석 요청 DTO
 */
export const RegressionAnalysisRequestSchema = z.object({
  analysisName: z.string().min(1, "분석 이름은 필수입니다"),
  data: z
    .array(z.record(z.string(), z.number()))
    .min(1, "분석할 데이터가 필요합니다"),
  modelType: z.enum([
    "ols",
    "gls",
    "2sls",
    "logit",
    "probit",
    "poisson",
    "var",
    "vecm",
    "garch",
    "arima",
  ]),
  dependentVariable: z.string().min(1, "종속변수는 필수입니다"),
  independentVariables: z
    .array(z.string())
    .min(1, "독립변수는 최소 하나 이상 필요합니다"),
  interceptIncluded: z.boolean().default(true),
  instrumentalVariables: z.array(z.string()).optional(),
  lagOrder: z.number().int().positive().optional(),
  confidenceLevel: z.number().min(0.9).max(0.99).default(0.95),
  robustStandardErrors: z.boolean().default(false),
  clusterVariable: z.string().optional(),
});

export type RegressionAnalysisRequest = z.infer<
  typeof RegressionAnalysisRequestSchema
>;

/**
 * 회귀분석 응답 DTO
 */
export const RegressionAnalysisResponseSchema = z.object({
  analysisId: z.string(),
  modelType: z.string(),
  coefficients: z.array(
    z.object({
      variable: z.string(),
      coefficient: z.number(),
      standardError: z.number(),
      tStatistic: z.number(),
      pValue: z.number(),
      confidenceInterval: z.tuple([z.number(), z.number()]),
      significance: z.enum([
        "not_significant",
        "marginally_significant",
        "significant",
        "highly_significant",
      ]),
    })
  ),
  modelFit: z.object({
    rSquared: z.number(),
    adjustedRSquared: z.number(),
    fStatistic: z.number(),
    fPValue: z.number(),
    logLikelihood: z.number(),
    aic: z.number(),
    bic: z.number(),
    residualStandardError: z.number(),
    observationsCount: z.number(),
    degreesOfFreedom: z.number(),
  }),
  diagnostics: z.object({
    normalityTest: z.object({
      jarqueBeraStatistic: z.number(),
      jarqueBeraPValue: z.number(),
      isNormal: z.boolean(),
    }),
    heteroskedasticityTest: z.object({
      breuschPaganStatistic: z.number(),
      breuschPaganPValue: z.number(),
      isHomoscedastic: z.boolean(),
    }),
    multicollinearityTest: z.object({
      maxVIF: z.number(),
      hasMulticollinearity: z.boolean(),
    }),
    autocorrelationTest: z.object({
      durbinWatsonStatistic: z.number(),
      hasAutocorrelation: z.boolean(),
    }),
  }),
  predictions: z.array(z.number()).optional(),
  residuals: z.array(z.number()),
  timestamp: z.string().datetime(),
});

export type RegressionAnalysisResponse = z.infer<
  typeof RegressionAnalysisResponseSchema
>;

/**
 * 예측 요청 DTO
 */
export const PredictionRequestSchema = z.object({
  modelId: z.string().min(1, "모델 ID는 필수입니다"),
  newDataPoints: z
    .array(z.record(z.string(), z.number()))
    .min(1, "예측할 데이터 포인트가 필요합니다"),
  includeConfidenceInterval: z.boolean().default(true),
  includePredictionInterval: z.boolean().default(true),
  confidenceLevel: z.number().min(0.9).max(0.99).default(0.95),
});

export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;

/**
 * 예측 응답 DTO
 */
export const PredictionResponseSchema = z.object({
  predictions: z.array(z.number()),
  confidenceIntervals: z.array(z.tuple([z.number(), z.number()])).optional(),
  predictionIntervals: z.array(z.tuple([z.number(), z.number()])).optional(),
  standardErrors: z.array(z.number()),
  timestamp: z.string().datetime(),
});

export type PredictionResponse = z.infer<typeof PredictionResponseSchema>;

// ===========================================
// Panel Data Analysis DTOs
// ===========================================

/**
 * 패널데이터 분석 요청 DTO
 */
export const PanelDataAnalysisRequestSchema = z.object({
  analysisName: z.string().min(1, "분석 이름은 필수입니다"),
  data: z
    .array(
      z.object({
        entityId: z.string(),
        timeId: z.string(),
        variables: z.record(z.string(), z.number()),
      })
    )
    .min(1, "패널데이터가 필요합니다"),
  dependentVariable: z.string().min(1, "종속변수는 필수입니다"),
  independentVariables: z
    .array(z.string())
    .min(1, "독립변수는 최소 하나 이상 필요합니다"),
  modelType: z.enum([
    "pooled_ols",
    "fixed_effects",
    "random_effects",
    "between_effects",
    "first_difference",
  ]),
  timeEffects: z.boolean().default(false),
  entityEffects: z.boolean().default(true),
  clusterByEntity: z.boolean().default(true),
  hausmanTest: z.boolean().default(true),
  instrumentalVariables: z.array(z.string()).optional(),
  laggedVariables: z
    .array(
      z.object({
        variable: z.string(),
        lags: z.array(z.number().int()),
      })
    )
    .optional(),
});

export type PanelDataAnalysisRequest = z.infer<
  typeof PanelDataAnalysisRequestSchema
>;

/**
 * 패널데이터 분석 응답 DTO
 */
export const PanelDataAnalysisResponseSchema = z.object({
  analysisId: z.string(),
  summaryStatistics: z.object({
    totalObservations: z.number(),
    numberOfEntities: z.number(),
    timePeriodsPerEntity: z.object({
      min: z.number(),
      max: z.number(),
      mean: z.number(),
    }),
    isBalanced: z.boolean(),
  }),
  modelResults: z.object({
    modelType: z.string(),
    coefficients: z.array(
      z.object({
        variable: z.string(),
        coefficient: z.number(),
        standardError: z.number(),
        tStatistic: z.number(),
        pValue: z.number(),
        significance: z.string(),
      })
    ),
    rSquared: z.object({
      within: z.number(),
      between: z.number(),
      overall: z.number(),
    }),
    fStatistic: z.object({
      value: z.number(),
      pValue: z.number(),
      degreesOfFreedom: z.tuple([z.number(), z.number()]),
    }),
  }),
  hausmanTest: z
    .object({
      statistic: z.number(),
      pValue: z.number(),
      degreesOfFreedom: z.number(),
      recommendation: z.enum(["fixed_effects", "random_effects"]),
    })
    .optional(),
  diagnostics: z.object({
    serialCorrelationTest: z.object({
      statistic: z.number(),
      pValue: z.number(),
      hasSerialCorrelation: z.boolean(),
    }),
    heteroskedasticityTest: z.object({
      statistic: z.number(),
      pValue: z.number(),
      hasHeteroscedasticity: z.boolean(),
    }),
    crossSectionalDependenceTest: z.object({
      statistic: z.number(),
      pValue: z.number(),
      hasCrossSectionalDependence: z.boolean(),
    }),
  }),
  timestamp: z.string().datetime(),
});

export type PanelDataAnalysisResponse = z.infer<
  typeof PanelDataAnalysisResponseSchema
>;

/**
 * Difference-in-Differences 분석 요청 DTO
 */
export const DifferenceInDifferencesRequestSchema = z.object({
  analysisName: z.string().min(1, "분석 이름은 필수입니다"),
  data: z
    .array(
      z.object({
        entityId: z.string(),
        timeId: z.string(),
        treatmentGroup: z.boolean(),
        postTreatment: z.boolean(),
        outcome: z.number(),
        covariates: z.record(z.string(), z.number()).optional(),
      })
    )
    .min(1, "DiD 데이터가 필요합니다"),
  outcomeVariable: z.string().min(1, "결과변수는 필수입니다"),
  treatmentVariable: z.string().min(1, "처치변수는 필수입니다"),
  timeVariable: z.string().min(1, "시간변수는 필수입니다"),
  controlVariables: z.array(z.string()).optional().default([]),
  clusteredStandardErrors: z.boolean().default(true),
  clusterVariable: z.string().optional(),
  placeboTest: z.boolean().default(true),
  parallelTrendsTest: z.boolean().default(true),
});

export type DifferenceInDifferencesRequest = z.infer<
  typeof DifferenceInDifferencesRequestSchema
>;

/**
 * Difference-in-Differences 분석 응답 DTO
 */
export const DifferenceInDifferencesResponseSchema = z.object({
  analysisId: z.string(),
  treatmentEffect: z.object({
    coefficient: z.number(),
    standardError: z.number(),
    tStatistic: z.number(),
    pValue: z.number(),
    confidenceInterval: z.tuple([z.number(), z.number()]),
    isSignificant: z.boolean(),
    interpretation: z.string(),
  }),
  baselineComparisons: z.object({
    treatmentGroupMean: z.object({
      preTreatment: z.number(),
      postTreatment: z.number(),
      change: z.number(),
    }),
    controlGroupMean: z.object({
      preTreatment: z.number(),
      postTreatment: z.number(),
      change: z.number(),
    }),
    differenceInDifferences: z.number(),
  }),
  robustnessChecks: z.object({
    parallelTrendsTest: z
      .object({
        statistic: z.number(),
        pValue: z.number(),
        assumptionSatisfied: z.boolean(),
      })
      .optional(),
    placeboTest: z
      .object({
        coefficient: z.number(),
        pValue: z.number(),
        isPlaceboSignificant: z.boolean(),
      })
      .optional(),
  }),
  modelDiagnostics: z.object({
    rSquared: z.number(),
    adjustedRSquared: z.number(),
    fStatistic: z.number(),
    observations: z.number(),
    treatedObservations: z.number(),
    controlObservations: z.number(),
  }),
  timestamp: z.string().datetime(),
});

export type DifferenceInDifferencesResponse = z.infer<
  typeof DifferenceInDifferencesResponseSchema
>;

// ===========================================
// Economic Forecasting DTOs
// ===========================================

/**
 * 경제지표 예측 요청 DTO
 */
export const EconomicForecastingRequestSchema = z.object({
  forecastName: z.string().min(1, "예측 이름은 필수입니다"),
  indicatorType: z.enum([
    "gdp",
    "inflation",
    "unemployment",
    "interest_rate",
    "exchange_rate",
    "stock_index",
    "housing_price",
    "commodity_price",
    "consumer_confidence",
    "business_confidence",
    "trade_balance",
    "fiscal_balance",
  ]),
  data: z
    .array(
      z.object({
        timestamp: z.string().datetime(),
        value: z.number(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .min(2, "최소 2개의 데이터 포인트가 필요합니다"),
  modelType: z.enum([
    "arima",
    "sarima",
    "var",
    "vecm",
    "kalman_filter",
    "state_space",
    "neural_network",
    "ensemble",
    "structural",
    "reduced_form",
  ]),
  horizonPeriods: z.number().int().positive().max(60).default(12),
  confidenceLevel: z.number().min(0.9).max(0.99).default(0.95),
  seasonalityAdjustment: z.boolean().default(true),
  structuralBreakDetection: z.boolean().default(true),
  externalVariables: z.array(z.string()).optional(),
  modelParameters: z
    .object({
      arimaOrder: z
        .tuple([z.number().int(), z.number().int(), z.number().int()])
        .optional(),
      seasonalOrder: z
        .tuple([
          z.number().int(),
          z.number().int(),
          z.number().int(),
          z.number().int(),
        ])
        .optional(),
      lagOrder: z.number().int().positive().optional(),
      hiddenLayers: z.array(z.number().int().positive()).optional(),
      learningRate: z.number().positive().optional(),
      epochs: z.number().int().positive().optional(),
    })
    .optional(),
});

export type EconomicForecastingRequest = z.infer<
  typeof EconomicForecastingRequestSchema
>;

/**
 * 경제지표 예측 응답 DTO
 */
export const EconomicForecastingResponseSchema = z.object({
  forecastId: z.string(),
  indicatorType: z.string(),
  modelType: z.string(),
  forecasts: z.array(
    z.object({
      period: z.string().datetime(),
      forecastValue: z.number(),
      lowerBound: z.number(),
      upperBound: z.number(),
      probabilityDistribution: z
        .object({
          mean: z.number(),
          variance: z.number(),
          quantiles: z.record(z.string(), z.number()),
        })
        .optional(),
    })
  ),
  modelDiagnostics: z.object({
    aic: z.number(),
    bic: z.number(),
    logLikelihood: z.number(),
    isStationary: z.boolean(),
    hasSeasonality: z.boolean(),
    structuralBreaks: z.array(
      z.object({
        breakDate: z.string().datetime(),
        breakType: z.string(),
        confidence: z.number(),
      })
    ),
  }),
  accuracy: z.object({
    mae: z.number(),
    mape: z.number(),
    rmse: z.number(),
    theilsU: z.number(),
    directionAccuracy: z.number(),
  }),
  timestamp: z.string().datetime(),
});

export type EconomicForecastingResponse = z.infer<
  typeof EconomicForecastingResponseSchema
>;

/**
 * 시나리오 분석 요청 DTO
 */
export const ScenarioAnalysisRequestSchema = z.object({
  analysisName: z.string().min(1, "시나리오 분석 이름은 필수입니다"),
  baselineModelId: z.string().min(1, "기준 모델 ID는 필수입니다"),
  alternativeScenarios: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        exogenousShocks: z.record(z.string(), z.array(z.number())),
        probability: z.number().min(0).max(1),
      })
    )
    .min(1, "최소 하나의 대안 시나리오가 필요합니다"),
  stressTestScenarios: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        shockMagnitude: z.number(),
        shockDuration: z.number().int().positive(),
        shockType: z.enum(["level", "growth", "volatility"]),
      })
    )
    .optional(),
  monteCarloSimulations: z.number().int().positive().max(10000).default(1000),
  confidenceLevels: z.array(z.number()).default([0.95, 0.99]),
});

export type ScenarioAnalysisRequest = z.infer<
  typeof ScenarioAnalysisRequestSchema
>;

/**
 * 시나리오 분석 응답 DTO
 */
export const ScenarioAnalysisResponseSchema = z.object({
  analysisId: z.string(),
  baselineForecasts: z.array(
    z.object({
      period: z.string().datetime(),
      value: z.number(),
      lowerBound: z.number(),
      upperBound: z.number(),
    })
  ),
  alternativeForecasts: z.record(
    z.string(),
    z.array(
      z.object({
        period: z.string().datetime(),
        value: z.number(),
        lowerBound: z.number(),
        upperBound: z.number(),
      })
    )
  ),
  stressTestResults: z
    .record(
      z.string(),
      z.array(
        z.object({
          period: z.string().datetime(),
          value: z.number(),
          lowerBound: z.number(),
          upperBound: z.number(),
        })
      )
    )
    .optional(),
  monteCarloResults: z.object({
    meanForecasts: z.array(z.number()),
    medianForecasts: z.array(z.number()),
    confidenceIntervals: z.record(
      z.string(),
      z.array(z.tuple([z.number(), z.number()]))
    ),
  }),
  riskMetrics: z.object({
    valueAtRisk: z.record(z.string(), z.number()),
    expectedShortfall: z.record(z.string(), z.number()),
    maximumDrawdown: z.number(),
    volatility: z.number(),
  }),
  timestamp: z.string().datetime(),
});

export type ScenarioAnalysisResponse = z.infer<
  typeof ScenarioAnalysisResponseSchema
>;

// ===========================================
// Common DTOs
// ===========================================

/**
 * 에러 응답 DTO
 */
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.string()).optional(),
    timestamp: z.string().datetime(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * 성공 응답 DTO
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  timestamp: z.string().datetime(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

/**
 * 페이지네이션 요청 DTO
 */
export const PaginationRequestSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;

/**
 * 페이지네이션 응답 DTO
 */
export const PaginationResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalItems: z.number(),
    itemsPerPage: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;

/**
 * 필터 요청 DTO
 */
export const FilterRequestSchema = z.object({
  filters: z.record(z.string(), z.any()),
  dateRange: z
    .object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    })
    .optional(),
  searchQuery: z.string().optional(),
});

export type FilterRequest = z.infer<typeof FilterRequestSchema>;
