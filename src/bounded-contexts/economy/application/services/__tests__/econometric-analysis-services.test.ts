/**
 * @fileoverview 실증분석 서비스들 통합 테스트
 * @description Application Services의 기본 동작을 검증
 */

import {
  ABTestingAnalysisService,
  EconomicForecastingService,
  PanelDataAnalysisService,
  RegressionAnalysisService,
} from "../index";

describe("Economy Application Services 통합 테스트", () => {
  describe("ABTestingAnalysisService", () => {
    it("서비스 클래스가 정의되어야 한다", () => {
      expect(ABTestingAnalysisService).toBeDefined();
      expect(typeof ABTestingAnalysisService).toBe("function");
    });
  });

  describe("PanelDataAnalysisService", () => {
    it("서비스 클래스가 정의되어야 한다", () => {
      expect(PanelDataAnalysisService).toBeDefined();
      expect(typeof PanelDataAnalysisService).toBe("function");
    });
  });

  describe("RegressionAnalysisService", () => {
    let service: RegressionAnalysisService;

    beforeEach(() => {
      service = new RegressionAnalysisService();
    });

    it("서비스 인스턴스가 생성되어야 한다", () => {
      expect(service).toBeInstanceOf(RegressionAnalysisService);
    });

    it("회귀분석 실행 메서드가 존재해야 한다", () => {
      expect(typeof service.runRegression).toBe("function");
    });

    it("예측 메서드가 존재해야 한다", () => {
      expect(typeof service.predict).toBe("function");
    });

    it("모델 비교 메서드가 존재해야 한다", () => {
      expect(typeof service.compareModels).toBe("function");
    });
  });

  describe("EconomicForecastingService", () => {
    let service: EconomicForecastingService;

    beforeEach(() => {
      service = new EconomicForecastingService();
    });

    it("서비스 인스턴스가 생성되어야 한다", () => {
      expect(service).toBeInstanceOf(EconomicForecastingService);
    });

    it("경제지표 예측 메서드가 존재해야 한다", () => {
      expect(typeof service.forecastIndicator).toBe("function");
    });

    it("다중 지표 예측 메서드가 존재해야 한다", () => {
      expect(typeof service.forecastMultipleIndicators).toBe("function");
    });

    it("시나리오 분석 메서드가 존재해야 한다", () => {
      expect(typeof service.runScenarioAnalysis).toBe("function");
    });

    it("실시간 예측 업데이트 메서드가 존재해야 한다", () => {
      expect(typeof service.updateForecast).toBe("function");
    });

    it("예측 성과 평가 메서드가 존재해야 한다", () => {
      expect(typeof service.evaluateForecastPerformance).toBe("function");
    });
  });

  describe("서비스 통합성 검증", () => {
    it("모든 서비스가 정상적으로 import 되어야 한다", () => {
      expect(ABTestingAnalysisService).toBeDefined();
      expect(PanelDataAnalysisService).toBeDefined();
      expect(RegressionAnalysisService).toBeDefined();
      expect(EconomicForecastingService).toBeDefined();
    });

    it("서비스들이 독립적인 클래스여야 한다", () => {
      expect(ABTestingAnalysisService).not.toBe(PanelDataAnalysisService);
      expect(PanelDataAnalysisService).not.toBe(RegressionAnalysisService);
      expect(RegressionAnalysisService).not.toBe(EconomicForecastingService);
    });
  });
});
