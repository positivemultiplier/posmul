/**
 * Prediction Repository Interface
 *
 * 개별 예측(Prediction) 엔티티를 위한 Repository 인터페이스
 * PredictionGame Aggregate와 독립적으로 Prediction을 다룰 때 사용
 *
 * @author PosMul Development Team
 * @since 2024-12
 * @task PD-003
 */

import {
  PredictionGameId,
  PredictionId,
  UserId,
} from "@posmul/shared-types";
import { Result } from "@posmul/shared-types";
import { Prediction } from "../entities/prediction-game.aggregate";
import {
  PaginatedResult,
  PaginationRequest,
  RepositoryError,
} from "./prediction-game.repository";

/**
 * 예측 검색 필터 인터페이스
 */
export interface PredictionSearchFilters {
  readonly userId?: UserId;
  readonly gameId?: PredictionGameId;
  readonly selectedOptionId?: string;
  readonly minStake?: number;
  readonly maxStake?: number;
  readonly minConfidence?: number;
  readonly maxConfidence?: number;
  readonly hasResult?: boolean;
  readonly createdFrom?: Date;
  readonly createdTo?: Date;
}

/**
 * 예측 성과 통계 인터페이스
 */
export interface PredictionPerformanceStats {
  readonly totalPredictions: number;
  readonly correctPredictions: number;
  readonly accuracyRate: number;
  readonly averageConfidence: number;
  readonly totalStaked: number;
  readonly totalRewards: number;
  readonly roi: number; // Return on Investment
}

/**
 * Prediction Repository 인터페이스
 *
 * 개별 Prediction 엔티티에 대한 CRUD 및 쿼리 기능
 * PredictionGame Aggregate와 함께 사용되거나 독립적으로 사용 가능
 */
export interface IPredictionRepository {
  /**
   * 예측 저장
   *
   * @param prediction 저장할 예측
   * @returns 성공 시 void, 실패 시 RepositoryError
   */
  save(prediction: Prediction): Promise<Result<void, RepositoryError>>;

  /**
   * ID로 예측 조회
   *
   * @param id 조회할 예측 ID
   * @returns 성공 시 예측 객체 또는 null, 실패 시 RepositoryError
   */
  findById(
    id: PredictionId
  ): Promise<Result<Prediction | null, RepositoryError>>;

  /**
   * 여러 ID로 예측 일괄 조회
   *
   * @param ids 조회할 예측 ID 목록
   * @returns 성공 시 예측 객체 맵, 실패 시 RepositoryError
   */
  findByIds(
    ids: PredictionId[]
  ): Promise<Result<Map<PredictionId, Prediction>, RepositoryError>>;

  /**
   * 게임별 예측 조회
   *
   * @param gameId 게임 ID
   * @param pagination 페이지네이션 설정
   * @returns 성공 시 예측 목록, 실패 시 RepositoryError
   */
  findByGame(
    gameId: PredictionGameId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<Prediction>, RepositoryError>>;

  /**
   * 사용자별 예측 조회
   *
   * @param userId 사용자 ID
   * @param pagination 페이지네이션 설정
   * @returns 성공 시 예측 목록, 실패 시 RepositoryError
   */
  findByUser(
    userId: UserId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<Prediction>, RepositoryError>>;

  /**
   * 사용자의 특정 게임 예측 조회
   *
   * @param userId 사용자 ID
   * @param gameId 게임 ID
   * @returns 성공 시 예측 객체 또는 null, 실패 시 RepositoryError
   */
  findByUserAndGame(
    userId: UserId,
    gameId: PredictionGameId
  ): Promise<Result<Prediction | null, RepositoryError>>;

  /**
   * 고급 검색 (필터 조건 적용)
   *
   * @param filters 검색 필터 조건
   * @param pagination 페이지네이션 설정
   * @returns 성공 시 필터링된 예측 목록, 실패 시 RepositoryError
   */
  search(
    filters: PredictionSearchFilters,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<Prediction>, RepositoryError>>;

  /**
   * 결과 미설정 예측 조회 (정산 배치 작업용)
   *
   * @param gameIds 대상 게임 ID 목록
   * @param limit 조회할 최대 개수
   * @returns 성공 시 예측 목록, 실패 시 RepositoryError
   */
  findPendingResults(
    gameIds: PredictionGameId[],
    limit?: number
  ): Promise<Result<Prediction[], RepositoryError>>;

  /**
   * 사용자 예측 성과 통계
   *
   * @param userId 사용자 ID
   * @param fromDate 시작 날짜 (선택적)
   * @param toDate 종료 날짜 (선택적)
   * @returns 성공 시 성과 통계, 실패 시 RepositoryError
   */
  getUserPerformanceStats(
    userId: UserId,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Result<PredictionPerformanceStats, RepositoryError>>;

  /**
   * 게임별 예측 통계
   *
   * @param gameId 게임 ID
   * @returns 성공 시 게임 예측 통계, 실패 시 RepositoryError
   */
  getGamePredictionStats(gameId: PredictionGameId): Promise<
    Result<
      {
        totalPredictions: number;
        optionDistribution: Record<string, number>;
        averageStake: number;
        averageConfidence: number;
        uniqueParticipants: number;
      },
      RepositoryError
    >
  >;

  /**
   * 예측 존재 여부 확인
   *
   * @param id 확인할 예측 ID
   * @returns 성공 시 존재 여부, 실패 시 RepositoryError
   */
  exists(id: PredictionId): Promise<Result<boolean, RepositoryError>>;

  /**
   * 사용자가 게임에 이미 참여했는지 확인
   *
   * @param userId 사용자 ID
   * @param gameId 게임 ID
   * @returns 성공 시 참여 여부, 실패 시 RepositoryError
   */
  hasUserParticipated(
    userId: UserId,
    gameId: PredictionGameId
  ): Promise<Result<boolean, RepositoryError>>;

  /**
   * 예측 삭제 (소프트 삭제 권장)
   *
   * @param id 삭제할 예측 ID
   * @returns 성공 시 void, 실패 시 RepositoryError
   */
  delete(id: PredictionId): Promise<Result<void, RepositoryError>>;

  /**
   * 벌크 예측 결과 업데이트 (정산 배치 작업용)
   *
   * @param predictions 업데이트할 예측 목록
   * @returns 성공 시 업데이트된 예측 수, 실패 시 RepositoryError
   */
  bulkUpdateResults(
    predictions: Prediction[]
  ): Promise<Result<number, RepositoryError>>;

  /**
   * 높은 신뢰도 예측 조회 (분석용)
   *
   * @param minConfidence 최소 신뢰도 (0-1)
   * @param limit 조회할 최대 개수
   * @returns 성공 시 높은 신뢰도 예측 목록, 실패 시 RepositoryError
   */
  findHighConfidencePredictions(
    minConfidence: number,
    limit?: number
  ): Promise<Result<Prediction[], RepositoryError>>;

  /**
   * 게임별 상위 성과 예측자 조회
   *
   * @param gameId 게임 ID
   * @param limit 조회할 최대 개수
   * @returns 성공 시 상위 성과자 목록, 실패 시 RepositoryError
   */
  getTopPerformersForGame(
    gameId: PredictionGameId,
    limit?: number
  ): Promise<
    Result<
      Array<{
        userId: UserId;
        prediction: Prediction;
        performanceScore: number;
      }>,
      RepositoryError
    >
  >;
}

/**
 * Repository 검증 헬퍼
 */
export class PredictionRepositoryHelpers {
  /**
   * 검색 필터 유효성 검증
   */
  static validateSearchFilters(
    filters: PredictionSearchFilters
  ): Result<void, RepositoryError> {
    if (filters.minConfidence && filters.maxConfidence) {
      if (filters.minConfidence > filters.maxConfidence) {
        return {
          success: false,
          error: new RepositoryError(
            "minConfidence cannot be greater than maxConfidence",
            "INVALID_FILTER"
          ),
        };
      }
    }

    if (filters.minStake && filters.maxStake) {
      if (filters.minStake > filters.maxStake) {
        return {
          success: false,
          error: new RepositoryError(
            "minStake cannot be greater than maxStake",
            "INVALID_FILTER"
          ),
        };
      }
    }

    if (filters.createdFrom && filters.createdTo) {
      if (filters.createdFrom > filters.createdTo) {
        return {
          success: false,
          error: new RepositoryError(
            "createdFrom cannot be later than createdTo",
            "INVALID_FILTER"
          ),
        };
      }
    }

    return { success: true, data: undefined };
  }

  /**
   * 신뢰도 범위 유효성 검증
   */
  static validateConfidenceRange(
    min?: number,
    max?: number
  ): Result<void, RepositoryError> {
    if (min !== undefined && (min < 0 || min > 1)) {
      return {
        success: false,
        error: new RepositoryError(
          "Confidence must be between 0 and 1",
          "INVALID_CONFIDENCE"
        ),
      };
    }

    if (max !== undefined && (max < 0 || max > 1)) {
      return {
        success: false,
        error: new RepositoryError(
          "Confidence must be between 0 and 1",
          "INVALID_CONFIDENCE"
        ),
      };
    }

    return { success: true, data: undefined };
  }
}
