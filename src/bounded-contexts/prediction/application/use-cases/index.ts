/**
 * Prediction Domain Use Cases Index
 *
 * 예측 도메인의 모든 Use Case들을 통합 export합니다.
 * Application Layer의 진입점 역할을 수행합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

// Use Case Classes
export { CreatePredictionGameUseCase } from "./create-prediction-game.use-case";
export { DistributeMoneyWaveUseCase } from "./distribute-money-wave.use-case";
export { ParticipatePredictionUseCase } from "./participate-prediction.use-case";
export { SettlePredictionGameUseCase } from "./settle-prediction-game.use-case";

// DTOs
export type {
  CreatePredictionGameRequest,
  CreatePredictionGameResponse,
  DistributeMoneyWaveRequest,
  DistributeMoneyWaveResponse,
  ParticipatePredictionRequest,
  ParticipatePredictionResponse,
  SettlePredictionGameRequest,
  SettlePredictionGameResponse,
  UseCaseResponse,
} from "../dto/prediction-use-case.dto";

export { MoneyWaveDistributionType } from "../dto/prediction-use-case.dto";

/**
 * Use Case 팩토리 인터페이스
 */
export interface PredictionUseCaseFactory {
  createPredictionGame(): import("./create-prediction-game.use-case").CreatePredictionGameUseCase;
  participatePrediction(): import("./participate-prediction.use-case").ParticipatePredictionUseCase;
  settlePredictionGame(): import("./settle-prediction-game.use-case").SettlePredictionGameUseCase;
  distributeMoneyWave(): import("./distribute-money-wave.use-case").DistributeMoneyWaveUseCase;
}

/**
 * Use Case 집합 인터페이스 (의존성 주입용)
 */
export interface PredictionUseCases {
  readonly createPredictionGame: import("./create-prediction-game.use-case").CreatePredictionGameUseCase;
  readonly participatePrediction: import("./participate-prediction.use-case").ParticipatePredictionUseCase;
  readonly settlePredictionGame: import("./settle-prediction-game.use-case").SettlePredictionGameUseCase;
  readonly distributeMoneyWave: import("./distribute-money-wave.use-case").DistributeMoneyWaveUseCase;
}
