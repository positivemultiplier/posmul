/**
 * Economy Application Services - Index
 *
 * 경제 도메인의 Application Services를 export
 * 실증분석, 계량경제학, 머신러닝 분석 서비스 포함
 */

// A/B 테스트 분석 서비스
export * from "./ab-testing-analysis.service";

// 패널 데이터 분석 서비스
export * from "./panel-data-analysis.service";

// 회귀 분석 서비스
export { RegressionAnalysisService } from "./regression-analysis.service";

// 경제 예측 서비스
export { EconomicForecastingService } from "./economic-forecasting.service";

// 머신러닝 분석 서비스
export * from "./machine-learning-analysis.service";
