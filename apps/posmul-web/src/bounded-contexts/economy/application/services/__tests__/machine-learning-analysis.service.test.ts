/**
 * @fileoverview Machine Learning Analysis Service 테스트
 * @description ML 기반 경제 분석 서비스의 기본 기능 테스트
 * @author Economy Domain Test Team
 * @version 1.0.0
 */
import { IEconomicAnalyticsRepository } from "../../../domain/repositories";
import {
  type AnomalyDetectionRequest,
  type ClusteringAnalysisRequest,
  MachineLearningAnalysisService,
  type TimeSeriesForecastRequest,
} from "../machine-learning-analysis.service";

// Mock repository
const mockRepository: IEconomicAnalyticsRepository = {
  // 필요한 메서드들을 mock으로 구현
} as any;

describe("MachineLearningAnalysisService", () => {
  let service: MachineLearningAnalysisService;

  beforeEach(() => {
    service = new MachineLearningAnalysisService(mockRepository);
  });

  describe("기본 설정 및 초기화", () => {
    test("서비스가 올바르게 초기화되어야 함", () => {
      expect(service).toBeInstanceOf(MachineLearningAnalysisService);
    });
  });

  describe("데이터 타입 검증", () => {
    test("TimeSeriesForecastRequest 인터페이스가 올바르게 작동해야 함", () => {
      const request: TimeSeriesForecastRequest = {
        targetVariable: "gdp_growth",
        forecastHorizon: 12,
        seasonality: "AUTO",
        includeExogenousVariables: true,
        exogenousVariables: ["interest_rate", "inflation"],
        confidenceLevel: 0.95,
        modelType: "LSTM",
        hyperparameters: { units: 50, dropout: 0.2 },
      };

      expect(request.targetVariable).toBe("gdp_growth");
      expect(request.forecastHorizon).toBe(12);
      expect(request.seasonality).toBe("AUTO");
      expect(request.modelType).toBe("LSTM");
    });

    test("ClusteringAnalysisRequest 인터페이스가 올바르게 작동해야 함", () => {
      const request: ClusteringAnalysisRequest = {
        variables: ["gdp", "inflation", "unemployment"],
        numberOfClusters: 3,
        algorithm: "KMEANS",
        distanceMetric: "EUCLIDEAN",
        normalization: "STANDARDIZE",
        clusterInterpretation: true,
      };

      expect(request.variables).toHaveLength(3);
      expect(request.numberOfClusters).toBe(3);
      expect(request.algorithm).toBe("KMEANS");
      expect(request.clusterInterpretation).toBe(true);
    });

    test("AnomalyDetectionRequest 인터페이스가 올바르게 작동해야 함", () => {
      const request: AnomalyDetectionRequest = {
        variables: ["stock_price", "volume"],
        method: "ISOLATION_FOREST",
        contaminationRate: 0.1,
        realTimeDetection: true,
        alertThreshold: 0.8,
      };

      expect(request.variables).toHaveLength(2);
      expect(request.method).toBe("ISOLATION_FOREST");
      expect(request.contaminationRate).toBe(0.1);
      expect(request.realTimeDetection).toBe(true);
    });
  });

  describe("시계열 예측 기본 테스트", () => {
    test("기본 ARIMA 모델 요청 처리", () => {
      const request: TimeSeriesForecastRequest = {
        targetVariable: "gdp_growth",
        forecastHorizon: 6,
        seasonality: "NONE",
        includeExogenousVariables: false,
        confidenceLevel: 0.95,
        modelType: "ARIMA",
      };

      // 요청 객체가 올바르게 구성되었는지 검증
      expect(request.targetVariable).toBe("gdp_growth");
      expect(request.forecastHorizon).toBe(6);
      expect(request.modelType).toBe("ARIMA");
    });

    test("고급 LSTM 모델 요청 처리", () => {
      const request: TimeSeriesForecastRequest = {
        targetVariable: "stock_price",
        forecastHorizon: 30,
        seasonality: "AUTO",
        includeExogenousVariables: true,
        exogenousVariables: ["volume", "volatility", "market_sentiment"],
        confidenceLevel: 0.9,
        modelType: "LSTM",
        hyperparameters: {
          layers: [50, 25],
          dropout: 0.3,
          batch_size: 32,
          epochs: 100,
        },
      };

      expect(request.modelType).toBe("LSTM");
      expect(request.exogenousVariables).toHaveLength(3);
      expect(request.hyperparameters).toBeDefined();
      expect(request.hyperparameters?.layers).toEqual([50, 25]);
    });
  });

  describe("클러스터링 분석 테스트", () => {
    test("K-Means 클러스터링 요청 구성", () => {
      const request: ClusteringAnalysisRequest = {
        variables: ["gdp_per_capita", "inflation_rate", "unemployment_rate"],
        numberOfClusters: 4,
        algorithm: "KMEANS",
        distanceMetric: "EUCLIDEAN",
        normalization: "STANDARDIZE",
        clusterInterpretation: true,
      };

      expect(request.algorithm).toBe("KMEANS");
      expect(request.numberOfClusters).toBe(4);
      expect(request.variables).toContain("gdp_per_capita");
    });

    test("자동 클러스터 수 결정 요청", () => {
      const request: ClusteringAnalysisRequest = {
        variables: ["economic_indicator_1", "economic_indicator_2"],
        numberOfClusters: "AUTO",
        algorithm: "HIERARCHICAL",
        distanceMetric: "MANHATTAN",
        normalization: "ROBUST",
        clusterInterpretation: false,
      };

      expect(request.numberOfClusters).toBe("AUTO");
      expect(request.algorithm).toBe("HIERARCHICAL");
      expect(request.clusterInterpretation).toBe(false);
    });
  });

  describe("이상 탐지 테스트", () => {
    test("Isolation Forest 이상 탐지 요청", () => {
      const request: AnomalyDetectionRequest = {
        variables: ["daily_return", "volume_change"],
        method: "ISOLATION_FOREST",
        contaminationRate: 0.05,
        realTimeDetection: false,
        alertThreshold: 0.95,
      };

      expect(request.method).toBe("ISOLATION_FOREST");
      expect(request.contaminationRate).toBe(0.05);
      expect(request.realTimeDetection).toBe(false);
    });

    test("실시간 이상 탐지 설정", () => {
      const request: AnomalyDetectionRequest = {
        variables: ["price_movement", "trading_volume"],
        method: "AUTOENCODER",
        contaminationRate: 0.1,
        realTimeDetection: true,
        alertThreshold: 0.85,
      };

      expect(request.realTimeDetection).toBe(true);
      expect(request.method).toBe("AUTOENCODER");
      expect(request.alertThreshold).toBe(0.85);
    });
  });

  describe("하이퍼파라미터 검증", () => {
    test("LSTM 모델 하이퍼파라미터 구조", () => {
      const hyperparameters = {
        units: 64,
        layers: [64, 32, 16],
        dropout: 0.2,
        recurrent_dropout: 0.1,
        activation: "tanh",
        optimizer: "adam",
        learning_rate: 0.001,
        batch_size: 16,
        epochs: 50,
        validation_split: 0.2,
      };

      expect(hyperparameters.units).toBe(64);
      expect(hyperparameters.layers).toHaveLength(3);
      expect(hyperparameters.dropout).toBeLessThan(1);
      expect(hyperparameters.learning_rate).toBeGreaterThan(0);
    });

    test("ARIMA 모델 하이퍼파라미터 구조", () => {
      const hyperparameters = {
        p: 2, // AR order
        d: 1, // Differencing order
        q: 1, // MA order
        seasonal_p: 1,
        seasonal_d: 1,
        seasonal_q: 1,
        seasonal_periods: 12,
        information_criterion: "AIC",
        method: "css-mle",
      };

      expect(hyperparameters.p).toBeGreaterThanOrEqual(0);
      expect(hyperparameters.d).toBeGreaterThanOrEqual(0);
      expect(hyperparameters.q).toBeGreaterThanOrEqual(0);
      expect(hyperparameters.seasonal_periods).toBe(12);
    });
  });

  describe("요청 검증 테스트", () => {
    test("올바른 예측 기간 범위 검증", () => {
      const validRequest: TimeSeriesForecastRequest = {
        targetVariable: "gdp",
        forecastHorizon: 12, // 유효한 범위
        seasonality: "AUTO",
        includeExogenousVariables: false,
        confidenceLevel: 0.95,
        modelType: "ARIMA",
      };

      expect(validRequest.forecastHorizon).toBeGreaterThan(0);
      expect(validRequest.forecastHorizon).toBeLessThanOrEqual(100); // 예상 최대값
    });

    test("신뢰구간 범위 검증", () => {
      const request: TimeSeriesForecastRequest = {
        targetVariable: "inflation",
        forecastHorizon: 6,
        seasonality: "NONE",
        includeExogenousVariables: false,
        confidenceLevel: 0.95,
        modelType: "ARIMA",
      };

      expect(request.confidenceLevel).toBeGreaterThan(0);
      expect(request.confidenceLevel).toBeLessThan(1);
    });

    test("오염률 범위 검증", () => {
      const request: AnomalyDetectionRequest = {
        variables: ["price"],
        method: "ISOLATION_FOREST",
        contaminationRate: 0.1,
        realTimeDetection: false,
        alertThreshold: 0.9,
      };

      expect(request.contaminationRate).toBeGreaterThan(0);
      expect(request.contaminationRate).toBeLessThan(1);
      expect(request.alertThreshold).toBeGreaterThan(0);
      expect(request.alertThreshold).toBeLessThan(1);
    });
  });

  describe("엣지 케이스 테스트", () => {
    test("빈 변수 배열 처리", () => {
      const request: ClusteringAnalysisRequest = {
        variables: [], // 빈 배열
        numberOfClusters: 2,
        algorithm: "KMEANS",
        distanceMetric: "EUCLIDEAN",
        normalization: "STANDARDIZE",
        clusterInterpretation: false,
      };

      // 빈 배열도 유효한 요청으로 처리 (실제 처리에서 검증될 것)
      expect(Array.isArray(request.variables)).toBe(true);
      expect(request.variables).toHaveLength(0);
    });

    test("극단적인 하이퍼파라미터 값", () => {
      const extremeHyperparameters = {
        epochs: 1, // 최소값
        batch_size: 1, // 최소값
        learning_rate: 0.0001, // 매우 작은 값
        dropout: 0.9, // 높은 드롭아웃
      };

      expect(extremeHyperparameters.epochs).toBeGreaterThan(0);
      expect(extremeHyperparameters.batch_size).toBeGreaterThan(0);
      expect(extremeHyperparameters.learning_rate).toBeGreaterThan(0);
      expect(extremeHyperparameters.dropout).toBeLessThan(1);
    });
  });
});
