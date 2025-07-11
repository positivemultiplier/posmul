/**
 * Economy Domain Repositories Export Index
 *
 * Clean Architecture 원칙에 따라 도메인 계층에서 정의된 모든 Repository 인터페이스들을 export
 * 이 인터페이스들은 Infrastructure 계층에서 구현되며, Application 계층에서 의존성 주입으로 사용
 */

// PmpAmount/PmcAmount 계정 및 거래 관리
export type {
  AccountActivity,
  AccountBalance,
  AccountSearchFilter,
  IPmpAmountPmcAmountAccountRepository,
  Transaction,
} from "./pmp-pmc-account.repository";

// MoneyWave 실행 이력 및 효과 분석 (MoneyWaveType 제외 - value-objects에서 이미 export)
export type {
  IMoneyWaveHistoryRepository,
  MoneyWave1Record,
  MoneyWave2Record,
  MoneyWave3Record,
  MoneyWaveEffectiveness,
  MoneyWaveStatistics,
} from "./money-wave-history.repository";

// 사용자 효용함수 및 사회후생함수 데이터 (SocialWelfareParameters 제외 - services에서 이미 export)
export type {
  BehavioralBiasProfile,
  IUtilityFunctionRepository,
  IndividualUtilityParameters,
  SocialWelfareMeasurement,
  UtilityEstimationInput,
  UtilityPrediction,
} from "./utility-function.repository";

// 경제 분석 및 실증 연구 데이터
export type {
  ABTestConfiguration,
  ABTestResult,
  EconometricModelResult,
  IEconomicAnalyticsRepository,
  MacroeconomicIndicators,
  MarketFailureDetection,
  MicroeconomicIndicators,
  PanelDataObservation,
  PolicySimulationResult,
} from "./economic-analytics.repository";
