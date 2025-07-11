/**
 * Prediction Domain - Repository Interfaces Barrel Export
 *
 * Domain Layer의 모든 Repository 인터페이스를 중앙에서 관리
 * Clean Architecture 원칙에 따라 도메인 계층에서만 인터페이스 정의
 *
 * @author PosMul Development Team
 * @since 2024-12
 * @task PD-003
 */

// Prediction Game Repository
export type {
  GameSearchFilters,
  IPredictionGameRepository,
  PaginatedResult,
  PaginationRequest,
  RepositoryFactory,
} from "./prediction-game.repository";

export {
  RepositoryError,
  RepositoryErrorCodes,
  RepositoryHelpers,
} from "./prediction-game.repository";

// Prediction Repository
export type {
  IPredictionRepository,
  PredictionPerformanceStats,
  PredictionSearchFilters,
} from "./prediction.repository";

export { PredictionRepositoryHelpers } from "./prediction.repository";

/**
 * Repository 인터페이스 집합
 * Infrastructure Layer에서 이 인터페이스들을 구현
 */
export interface PredictionRepositories {
  readonly predictionGameRepository: import("./prediction-game.repository").IPredictionGameRepository;
  readonly predictionRepository: import("./prediction.repository").IPredictionRepository;
}

/**
 * Repository 공통 타입 정의
 */
export type {
  PredictionGameId,
  PredictionId,
  UserId,
} from "../../../../shared/types/branded-types";
export type { Result } from "@posmul/auth-economy-sdk";

/**
 * Repository 패턴의 주요 원칙:
 *
 * 1. 인터페이스 분리 원칙 (ISP): 각 Repository는 특정 Aggregate/Entity에만 집중
 * 2. 의존성 역전 원칙 (DIP): Domain이 Infrastructure에 의존하지 않음
 * 3. 일관된 에러 처리: Result 패턴 사용
 * 4. 도메인 객체만 사용: 순수 도메인 로직 유지
 * 5. 성능 최적화: 페이지네이션, 일괄 조회, 캐싱 고려
 */
