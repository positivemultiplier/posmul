/**
 * Prediction Infrastructure Repository Exports
 *
 * Repository 구현체들을 외부로 export
 *
 * @author PosMul Development Team
 * @since 2024-12
 * @task PD-006
 */

import { SupabasePredictionGameRepository } from "./supabase-prediction-game.repository";
import { SupabasePredictionRepository } from "./supabase-prediction.repository";

export { SupabasePredictionGameRepository, SupabasePredictionRepository };

// Repository 팩토리 함수들
export const createPredictionGameRepository = () =>
  new SupabasePredictionGameRepository();
export const createPredictionRepository = () =>
  new SupabasePredictionRepository();

// 타입 재export (편의성을 위해)
export type {
  GameSearchFilters,
  IPredictionGameRepository,
  PaginatedResult,
  PaginationRequest,
  RepositoryError,
  RepositoryHelpers,
} from "../../domain/repositories/prediction-game.repository";
export type {
  IPredictionRepository,
  PredictionPerformanceStats,
  PredictionSearchFilters,
} from "../../domain/repositories/prediction.repository";
