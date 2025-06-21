/**
 * Prediction Game Repository Interface
 *
 * Clean Architecture 원칙에 따른 도메인 계층의 Repository 인터페이스
 * Infrastructure 계층에서 이 인터페이스를 구현하여 의존성 역전 원칙을 준수
 *
 * @author PosMul Development Team
 * @since 2024-12
 * @task PD-003
 */

import {
  PredictionGameId,
  UserId,
} from "../../../../shared/types/branded-types";
import { Result } from "../../../../shared/types/economic-system";
import { PredictionGame } from "../entities/prediction-game.aggregate";
import { GameStatus } from "../value-objects/game-status";

/**
 * Repository 에러 타입
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

/**
 * Repository 에러 코드
 */
export const RepositoryErrorCodes = {
  NOT_FOUND: "REPOSITORY_NOT_FOUND",
  SAVE_FAILED: "REPOSITORY_SAVE_FAILED",
  QUERY_FAILED: "REPOSITORY_QUERY_FAILED",
  CONNECTION_FAILED: "REPOSITORY_CONNECTION_FAILED",
  CONSTRAINT_VIOLATION: "REPOSITORY_CONSTRAINT_VIOLATION",
  CONCURRENT_MODIFICATION: "REPOSITORY_CONCURRENT_MODIFICATION",
} as const;

/**
 * 페이지네이션 요청 인터페이스
 */
export interface PaginationRequest {
  readonly page: number;
  readonly limit: number;
  readonly sortBy?: "createdAt" | "updatedAt" | "title";
  readonly sortOrder?: "asc" | "desc";
}

/**
 * 페이지네이션 응답 인터페이스
 */
export interface PaginatedResult<T> {
  readonly items: T[];
  readonly totalCount: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

/**
 * 게임 검색 필터 인터페이스
 */
export interface GameSearchFilters {
  readonly creatorId?: UserId;
  readonly status?: GameStatus;
  readonly predictionType?: "binary" | "wdl" | "ranking";
  readonly title?: string;
  readonly startTimeFrom?: Date;
  readonly startTimeTo?: Date;
  readonly minParticipants?: number;
  readonly maxParticipants?: number;
}

/**
 * Prediction Game Repository 인터페이스
 *
 * Clean Architecture와 DDD 원칙을 준수하여 설계된 Repository 패턴
 * - 도메인 계층에 위치하며 Infrastructure 의존성 없음
 * - Result 패턴으로 일관된 에러 처리
 * - 도메인 객체만 사용하여 순수성 유지
 */
export interface IPredictionGameRepository {
  /**
   * 예측 게임 저장 (생성 또는 수정)
   *
   * @param game 저장할 예측 게임 Aggregate
   * @returns 성공 시 void, 실패 시 RepositoryError
   */
  save(game: PredictionGame): Promise<Result<void, RepositoryError>>;

  /**
   * ID로 예측 게임 조회
   *
   * @param id 조회할 게임 ID
   * @returns 성공 시 게임 객체 또는 null, 실패 시 RepositoryError
   */
  findById(
    id: PredictionGameId
  ): Promise<Result<PredictionGame | null, RepositoryError>>;

  /**
   * 여러 ID로 예측 게임 일괄 조회 (성능 최적화)
   *
   * @param ids 조회할 게임 ID 목록
   * @returns 성공 시 게임 객체 맵, 실패 시 RepositoryError
   */
  findByIds(
    ids: PredictionGameId[]
  ): Promise<Result<Map<PredictionGameId, PredictionGame>, RepositoryError>>;

  /**
   * 상태별 예측 게임 조회
   *
   * @param status 조회할 게임 상태
   * @param pagination 페이지네이션 설정
   * @returns 성공 시 게임 목록, 실패 시 RepositoryError
   */
  findByStatus(
    status: GameStatus,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>>;

  /**
   * 생성자별 예측 게임 조회
   *
   * @param creatorId 생성자 ID
   * @param pagination 페이지네이션 설정
   * @returns 성공 시 게임 목록, 실패 시 RepositoryError
   */
  findByCreator(
    creatorId: UserId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>>;

  /**
   * 사용자 참여 게임 조회
   *
   * @param userId 사용자 ID
   * @param pagination 페이지네이션 설정
   * @returns 성공 시 참여한 게임 목록, 실패 시 RepositoryError
   */
  findByParticipant(
    userId: UserId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>>;

  /**
   * 고급 검색 (필터 조건 적용)
   *
   * @param filters 검색 필터 조건
   * @param pagination 페이지네이션 설정
   * @returns 성공 시 필터링된 게임 목록, 실패 시 RepositoryError
   */
  search(
    filters: GameSearchFilters,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>>;

  /**
   * 활성 게임 목록 조회 (캐시 최적화 대상)
   *
   * @param pagination 페이지네이션 설정
   * @returns 성공 시 활성 게임 목록, 실패 시 RepositoryError
   */
  findActiveGames(
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>>;

  /**
   * 정산 대기 게임 목록 조회 (배치 작업용)
   *
   * @param limit 조회할 최대 개수
   * @returns 성공 시 정산 대기 게임 목록, 실패 시 RepositoryError
   */
  findPendingSettlement(
    limit?: number
  ): Promise<Result<PredictionGame[], RepositoryError>>;

  /**
   * 게임 존재 여부 확인
   *
   * @param id 확인할 게임 ID
   * @returns 성공 시 존재 여부, 실패 시 RepositoryError
   */
  exists(id: PredictionGameId): Promise<Result<boolean, RepositoryError>>;

  /**
   * 게임 삭제 (소프트 삭제 권장)
   *
   * @param id 삭제할 게임 ID
   * @returns 성공 시 void, 실패 시 RepositoryError
   */
  delete(id: PredictionGameId): Promise<Result<void, RepositoryError>>;

  /**
   * 필터 조건으로 게임 목록 조회 (새로운 UseCase용)
   *
   * @param options 조회 옵션
   * @returns 성공 시 게임 목록, 실패 시 RepositoryError
   */
  findMany(options: {
    filters?: any;
    pagination?: { limit: number; offset: number };
    sorting?: { field: string; order: "asc" | "desc" };
  }): Promise<Result<PredictionGame[], RepositoryError>>;

  /**
   * 필터 조건에 해당하는 게임 수 조회
   *
   * @param filters 필터 조건
   * @returns 성공 시 게임 수, 실패 시 RepositoryError
   */
  countByFilters(filters: any): Promise<Result<number, RepositoryError>>;

  /**
   * 게임 통계 조회
   *
   * @param id 게임 ID
   * @returns 성공 시 게임 통계, 실패 시 RepositoryError
   */
  getStatistics(id: PredictionGameId): Promise<
    Result<
      {
        totalParticipants: number;
        totalStake: number;
        averageConfidence: number;
        statusDistribution: Record<string, number>;
      },
      RepositoryError
    >
  >;

  /**
   * 트랜잭션 내에서 게임 저장 (동시성 제어)
   *
   * @param game 저장할 게임
   * @param version 낙관적 잠금을 위한 버전
   * @returns 성공 시 새 버전, 실패 시 RepositoryError
   */
  saveWithVersion(
    game: PredictionGame,
    version: number
  ): Promise<Result<number, RepositoryError>>;

  /**
   * 벌크 업데이트 (배치 작업용)
   *
   * @param games 업데이트할 게임 목록
   * @returns 성공 시 업데이트된 게임 수, 실패 시 RepositoryError
   */
  bulkUpdate(games: PredictionGame[]): Promise<Result<number, RepositoryError>>;
}

/**
 * Repository 인터페이스 기본 구현 팩토리
 * 테스트나 목업에서 사용할 수 있는 기본 구현체 생성 유틸리티
 */
export interface RepositoryFactory {
  createPredictionGameRepository(): IPredictionGameRepository;
}

/**
 * Repository 헬퍼 유틸리티
 */
export class RepositoryHelpers {
  /**
   * RepositoryError 생성 헬퍼
   */
  static createNotFoundError(entityType: string, id: string): RepositoryError {
    return new RepositoryError(
      `${entityType} not found with ID: ${id}`,
      RepositoryErrorCodes.NOT_FOUND
    );
  }

  static createSaveFailedError(
    entityType: string,
    reason: string,
    originalError?: Error
  ): RepositoryError {
    return new RepositoryError(
      `Failed to save ${entityType}: ${reason}`,
      RepositoryErrorCodes.SAVE_FAILED,
      originalError
    );
  }

  static createQueryFailedError(
    operation: string,
    reason: string,
    originalError?: Error
  ): RepositoryError {
    return new RepositoryError(
      `Query failed for ${operation}: ${reason}`,
      RepositoryErrorCodes.QUERY_FAILED,
      originalError
    );
  }

  /**
   * 기본 페이지네이션 설정
   */
  static getDefaultPagination(): PaginationRequest {
    return {
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
  }

  /**
   * 페이지네이션 유효성 검증
   */
  static validatePagination(
    pagination: PaginationRequest
  ): Result<void, RepositoryError> {
    if (pagination.page < 1) {
      return {
        success: false,
        error: new RepositoryError(
          "Page number must be greater than 0",
          "INVALID_PAGINATION"
        ),
      };
    }

    if (pagination.limit < 1 || pagination.limit > 100) {
      return {
        success: false,
        error: new RepositoryError(
          "Limit must be between 1 and 100",
          "INVALID_PAGINATION"
        ),
      };
    }

    return { success: true, data: undefined };
  }
}
