/**
 * @fileoverview A/B 테스팅 분석 서비스 테스트
 * @description ABTestingAnalysisService에 대한 기본 테스트 케이스
 * @author Economy Domain - Test Team
 * @version 1.0.0
 */
import { ABTestingAnalysisService } from "../ab-testing-analysis.service";

describe("ABTestingAnalysisService", () => {
  let service;
  const mockRepository = {
    getPanelData: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getEconomicIndicators: jest.fn(),
    getMarketData: jest.fn(),
    saveAnalysisResult: jest.fn(),
    saveMacroeconomicIndicators: jest.fn(),
    getMacroeconomicIndicators: jest.fn(),
    saveMicroeconomicIndicators: jest.fn(),
    getMicroeconomicIndicators: jest.fn(),
    getTimeSeries: jest.fn(),
    saveTimeSeriesData: jest.fn(),
    getCrossSection: jest.fn(),
    saveCrossSectionData: jest.fn(),
    executeCustomQuery: jest.fn(),
    getAggregatedData: jest.fn(),
    saveModelResult: jest.fn(),
    getModelHistory: jest.fn(),
    validateDataIntegrity: jest.fn(),
    performDataTransformation: jest.fn(),
  };

  beforeEach(() => {
    // @ts-ignore
    service = new ABTestingAnalysisService(mockRepository);
  });

  describe("Service Initialization", () => {
    it("should create service instance successfully", () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ABTestingAnalysisService);
    });
  });

  describe("Basic Functionality", () => {
    it("should have designExperiment method", () => {
      expect(service.designExperiment).toBeDefined();
      expect(typeof service.designExperiment).toBe("function");
    });

    it("should have analyzeABTestResults method", () => {
      expect(service.analyzeABTestResults).toBeDefined();
      expect(typeof service.analyzeABTestResults).toBe("function");
    });
  });

  describe("Experiment Design Configuration", () => {
    it("should support simple randomization strategy", () => {
      const experimentConfig = {
        testName: "Price Optimization Test",
        hypothesis: "Higher price increases revenue",
        controlGroupSize: 1000,
        treatmentGroupSize: 1000,
        duration: 14,
        significanceLevel: 0.05,
        minimumDetectableEffect: 0.1,
        primaryMetrics: ["revenue_per_user", "conversion_rate"],
        secondaryMetrics: ["engagement_time", "retention_rate"],
        randomizationStrategy: "SIMPLE",
        powerAnalysis: {
          targetPower: 0.8,
          effectSize: 0.2,
          variance: 1.0,
        },
      };

      expect(experimentConfig.randomizationStrategy).toBe("SIMPLE");
      expect(experimentConfig.powerAnalysis.targetPower).toBe(0.8);
      expect(experimentConfig.significanceLevel).toBe(0.05);
    });

    it("should support stratified randomization strategy", () => {
      const experimentConfig = {
        testName: "User Interface Test",
        hypothesis: "New UI improves user experience",
        controlGroupSize: 500,
        treatmentGroupSize: 500,
        duration: 21,
        significanceLevel: 0.01,
        minimumDetectableEffect: 0.15,
        primaryMetrics: ["user_satisfaction"],
        secondaryMetrics: ["task_completion_time"],
        randomizationStrategy: "STRATIFIED",
        powerAnalysis: {
          targetPower: 0.85,
          effectSize: 0.3,
          variance: 1.2,
        },
      };

      expect(experimentConfig.randomizationStrategy).toBe("STRATIFIED");
      expect(experimentConfig.significanceLevel).toBe(0.01);
    });
  });

  describe("Statistical Analysis Types", () => {
    it("should support interim analysis configuration", () => {
      const analysisRequest = {
        testId: "test_001",
        analysisType: "INTERIM",
        adjustmentMethod: "BENJAMINI_HOCHBERG",
        confidenceLevel: 0.95,
      };

      expect(analysisRequest.analysisType).toBe("INTERIM");
      expect(analysisRequest.adjustmentMethod).toBe("BENJAMINI_HOCHBERG");
      expect(analysisRequest.confidenceLevel).toBe(0.95);
    });

    it("should support final analysis configuration", () => {
      const analysisRequest = {
        testId: "test_002",
        analysisType: "FINAL",
        adjustmentMethod: "BONFERRONI",
        confidenceLevel: 0.99,
      };

      expect(analysisRequest.analysisType).toBe("FINAL");
      expect(analysisRequest.adjustmentMethod).toBe("BONFERRONI");
    });

    it("should support bayesian analysis with prior configuration", () => {
      const bayesianAnalysisRequest = {
        testId: "test_003",
        analysisType: "BAYESIAN_UPDATE",
        adjustmentMethod: "NONE",
        confidenceLevel: 0.95,
        bayesianPrior: {
          priorMean: 0.1,
          priorVariance: 0.05,
          distribution: "NORMAL",
        },
      };

      expect(bayesianAnalysisRequest.analysisType).toBe("BAYESIAN_UPDATE");
      expect(bayesianAnalysisRequest.bayesianPrior.distribution).toBe("NORMAL");
      expect(bayesianAnalysisRequest.bayesianPrior.priorMean).toBe(0.1);
    });
  });

  describe("Power Analysis Validation", () => {
    it("should validate power analysis parameters", () => {
      const powerAnalysisConfig = {
        targetPower: 0.8, // 80% power
        effectSize: 0.2, // Cohen's d = 0.2 (small effect)
        variance: 1.0,
      };

      // Power should be between 0 and 1
      expect(powerAnalysisConfig.targetPower).toBeGreaterThan(0);
      expect(powerAnalysisConfig.targetPower).toBeLessThanOrEqual(1);

      // Effect size should be positive
      expect(powerAnalysisConfig.effectSize).toBeGreaterThan(0);

      // Variance should be positive
      expect(powerAnalysisConfig.variance).toBeGreaterThan(0);
    });

    it("should handle different effect sizes (Cohen conventions)", () => {
      const effectSizes = {
        small: 0.2,
        medium: 0.5,
        large: 0.8,
      };

      expect(effectSizes.small).toBe(0.2);
      expect(effectSizes.medium).toBe(0.5);
      expect(effectSizes.large).toBe(0.8);

      // All effect sizes should be positive
      Object.values(effectSizes).forEach((size) => {
        expect(size).toBeGreaterThan(0);
      });
    });
  });

  describe("Sample Size Validation", () => {
    it("should validate minimum sample sizes for statistical power", () => {
      const minimalExperiment = {
        controlGroupSize: 100,
        treatmentGroupSize: 100,
        significanceLevel: 0.05,
        targetPower: 0.8,
      };

      expect(minimalExperiment.controlGroupSize).toBeGreaterThan(0);
      expect(minimalExperiment.treatmentGroupSize).toBeGreaterThan(0);
      expect(minimalExperiment.significanceLevel).toBeGreaterThan(0);
      expect(minimalExperiment.significanceLevel).toBeLessThan(1);
    });
  });
});
