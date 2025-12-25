/**
 * Update Prediction Game Use Case
 *
 * 예측 게임 업데이트 비즈니스 로직을 처리합니다.
 * - 게임 메타데이터 수정 (제목, 설명, 옵션)
 * - 게임 일정 조정 (시작시간, 종료시간, 정산시간)
 * - 게임 상태 변경 (생성됨 → 활성화, 일시정지, 취소)
 * - 권한 검증 및 비즈니스 규칙 적용
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import {
  PredictionGameId,
  Result,
  UseCaseError,
  UserId,
  isFailure,
} from "@posmul/auth-economy-sdk";

import {
  BaseDomainEvent,
  publishEvent,
} from "../../../../shared/events/domain-events";
import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";
import type { PredictionGame } from "../../domain/entities/prediction-game.aggregate";

type UpdateValueRecord = Record<string, unknown>;

interface UpdateChangeSet {
  readonly previousValues: UpdateValueRecord;
  readonly newValues: UpdateValueRecord;
  readonly updatedFields: string[];
}

/**
 * 예측 게임 업데이트 이벤트
 */
class PredictionGameUpdatedEvent extends BaseDomainEvent {
  constructor(
    gameId: PredictionGameId,
    updatedBy: UserId,
    updateFields: string[],
    previousValues: UpdateValueRecord,
    newValues: UpdateValueRecord
  ) {
    super("PREDICTION_GAME_UPDATED", gameId, {
      updatedBy,
      updateFields,
      previousValues,
      newValues,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 예측 게임 업데이트 요청 DTO
 */
export interface UpdatePredictionGameRequest {
  readonly gameId: PredictionGameId;
  readonly updatedBy: UserId;
  readonly updates: {
    readonly title?: string;
    readonly description?: string;
    readonly endTime?: Date;
    readonly settlementTime?: Date;
    readonly minimumStake?: number;
    readonly maximumStake?: number;
    readonly maxParticipants?: number;
    readonly options?: Array<{
      id: string;
      text: string;
      description?: string;
    }>;
    readonly metadata?: Record<string, unknown>;
  };
  readonly reason?: string;
}

/**
 * 예측 게임 업데이트 응답 DTO
 */
export interface UpdatePredictionGameResponse {
  readonly success: boolean;
  readonly gameId: PredictionGameId;
  readonly updatedFields: string[];
  readonly updatedAt: Date;
  readonly message: string;
}

/**
 * 예측 게임 업데이트 유스케이스
 *
 * 주요 기능:
 * 1. 게임 존재 및 권한 검증
 * 2. 업데이트 가능 상태 확인
 * 3. 비즈니스 규칙 적용
 * 4. 게임 정보 업데이트
 * 5. 도메인 이벤트 발행
 */
export class UpdatePredictionGameUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository
  ) {}

  /**
   * 예측 게임 업데이트 실행
   */
  async execute(
    request: UpdatePredictionGameRequest
  ): Promise<Result<UpdatePredictionGameResponse, UseCaseError>> {
    try {
      // 1. 입력 검증
      const validationResult = this.validateRequest(request);
      if (isFailure(validationResult)) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      // 2. 게임 조회
      const gameResult = await this.predictionGameRepository.findById(
        request.gameId
      );
      if (isFailure(gameResult)) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }

      const game = gameResult.data;
      if (!game) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }

      // 3. 권한 검증 - 게임 생성자만 수정 가능
      if (game.creatorId !== request.updatedBy) {
        return {
          success: false,
          error: new UseCaseError("Only game creator can update the game"),
        };
      }

      // 4. 업데이트 가능 상태 검증
      const currentStatus = game.status;
      if (currentStatus.isSettled()) {
        return {
          success: false,
          error: new UseCaseError("Cannot update completed or settled games"),
        };
      }

      // 5. 업데이트 적용 및 이전 값 저장
      const changes: UpdateChangeSet = {
        previousValues: {},
        newValues: {},
        updatedFields: [],
      };

      const applyUpdatesResult = this.applyUpdates(game, request, changes);
      if (isFailure(applyUpdatesResult)) {
        return {
          success: false,
          error: applyUpdatesResult.error,
        };
      }

      // 6. 업데이트가 있는지 확인
      if (changes.updatedFields.length === 0) {
        return {
          success: false,
          error: new UseCaseError("No valid updates provided"),
        };
      }

      // 7. 게임 저장
      const saveResult = await this.predictionGameRepository.save(game);
      if (isFailure(saveResult)) {
        return {
          success: false,
          error: new UseCaseError("Failed to save updated game"),
        };
      }

      // 8. 업데이트 이벤트 발행
      await publishEvent(
        new PredictionGameUpdatedEvent(
          request.gameId,
          request.updatedBy,
          changes.updatedFields,
          changes.previousValues,
          changes.newValues
        )
      );

      // 9. 성공 응답 반환
      return {
        success: true,
        data: {
          success: true,
          gameId: request.gameId,
          updatedFields: changes.updatedFields,
          updatedAt: new Date(),
          message: `Successfully updated ${changes.updatedFields.join(", ")}`,
        },
      };
    } catch (error) {
      const originalMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in UpdatePredictionGameUseCase",
          { originalError: originalMessage }
        ),
      };
    }
  }

  /**
   * 요청 검증
   */
  private validateRequest(
    request: UpdatePredictionGameRequest
  ): Result<void, UseCaseError> {
    const validators: Array<
      (req: UpdatePredictionGameRequest) => Result<void, UseCaseError>
    > = [
      this.validateRequiredFields.bind(this),
      this.validateTitle.bind(this),
      this.validateDescription.bind(this),
      this.validateTimes.bind(this),
      this.validateOptions.bind(this),
    ];

    for (const validator of validators) {
      const result = validator(request);
      if (isFailure(result)) {
        return result;
      }
    }

    return { success: true, data: undefined };
  }

  private validateRequiredFields(
    request: UpdatePredictionGameRequest
  ): Result<void, UseCaseError> {
    if (!request.gameId) {
      return {
        success: false,
        error: new UseCaseError("Game ID is required"),
      };
    }

    if (!request.updatedBy) {
      return {
        success: false,
        error: new UseCaseError("Updated by user ID is required"),
      };
    }

    if (!request.updates || Object.keys(request.updates).length === 0) {
      return {
        success: false,
        error: new UseCaseError("Updates object is required"),
      };
    }

    return { success: true, data: undefined };
  }

  private validateTitle(
    request: UpdatePredictionGameRequest
  ): Result<void, UseCaseError> {
    const { title } = request.updates;
    if (title === undefined) {
      return { success: true, data: undefined };
    }

    if (typeof title !== "string" || title.trim().length === 0) {
      return {
        success: false,
        error: new UseCaseError("Title must be a non-empty string"),
      };
    }

    if (title.length > 200) {
      return {
        success: false,
        error: new UseCaseError("Title must be 200 characters or less"),
      };
    }

    return { success: true, data: undefined };
  }

  private validateDescription(
    request: UpdatePredictionGameRequest
  ): Result<void, UseCaseError> {
    const { description } = request.updates;
    if (description === undefined) {
      return { success: true, data: undefined };
    }

    if (typeof description !== "string") {
      return {
        success: false,
        error: new UseCaseError("Description must be a string"),
      };
    }

    if (description.length > 2000) {
      return {
        success: false,
        error: new UseCaseError("Description must be 2000 characters or less"),
      };
    }

    return { success: true, data: undefined };
  }

  private validateTimes(
    request: UpdatePredictionGameRequest
  ): Result<void, UseCaseError> {
    const { endTime, settlementTime } = request.updates;

    if (endTime && !(endTime instanceof Date)) {
      return {
        success: false,
        error: new UseCaseError("End time must be a valid Date"),
      };
    }

    if (settlementTime && !(settlementTime instanceof Date)) {
      return {
        success: false,
        error: new UseCaseError("Settlement time must be a valid Date"),
      };
    }

    if (endTime && settlementTime && endTime >= settlementTime) {
      return {
        success: false,
        error: new UseCaseError("Settlement time must be after end time"),
      };
    }

    return { success: true, data: undefined };
  }

  private validateOptions(
    request: UpdatePredictionGameRequest
  ): Result<void, UseCaseError> {
    const { options } = request.updates;
    if (!options) {
      return { success: true, data: undefined };
    }

    if (!Array.isArray(options) || options.length < 2) {
      return {
        success: false,
        error: new UseCaseError("At least 2 options are required"),
      };
    }

    for (const option of options) {
      if (!option.id || !option.text) {
        return {
          success: false,
          error: new UseCaseError("Each option must have id and text"),
        };
      }
    }

    return { success: true, data: undefined };
  }

  private applyUpdates(
    game: PredictionGame,
    request: UpdatePredictionGameRequest,
    changes: UpdateChangeSet
  ): Result<void, UseCaseError> {
    const currentStatus = game.status;

    const isCreated = currentStatus.isCreated();
    const handlers: Array<() => Result<void, UseCaseError>> = [
      () => this.applyTitleUpdate(game, request, changes),
      () => this.applyDescriptionUpdate(game, request, changes),
      () => this.applyEndTimeUpdate(game, request, isCreated, changes),
      () => this.applySettlementTimeUpdate(game, request, isCreated, changes),
      () => this.applyOptionsUpdate(game, request, isCreated, changes),
      () => this.applyMetadataUpdate(request, changes),
      () => this.applyMinimumStakeUpdate(game, request, isCreated, changes),
      () => this.applyMaximumStakeUpdate(game, request, isCreated, changes),
      () => this.applyMaxParticipantsUpdate(game, request, isCreated, changes),
    ];

    for (const handler of handlers) {
      const result = handler();
      if (isFailure(result)) {
        return result;
      }
    }

    return { success: true, data: undefined };
  }

  private applyTitleUpdate(
    game: PredictionGame,
    request: UpdatePredictionGameRequest,
    changes: UpdateChangeSet
  ): Result<void, UseCaseError> {
    const { title } = request.updates;
    if (title === undefined || title === game.title) {
      return { success: true, data: undefined };
    }

    changes.previousValues.title = game.title;
    changes.newValues.title = title;
    changes.updatedFields.push("title");

    const updateResult = game.updateTitle(title);
    if (isFailure(updateResult)) {
      return {
        success: false,
        error: new UseCaseError("Failed to update game title"),
      };
    }

    return { success: true, data: undefined };
  }

  private applyDescriptionUpdate(
    game: PredictionGame,
    request: UpdatePredictionGameRequest,
    changes: UpdateChangeSet
  ): Result<void, UseCaseError> {
    const { description } = request.updates;
    if (description === undefined || description === game.description) {
      return { success: true, data: undefined };
    }

    changes.previousValues.description = game.description;
    changes.newValues.description = description;
    changes.updatedFields.push("description");

    const updateResult = game.updateDescription(description);
    if (isFailure(updateResult)) {
      return {
        success: false,
        error: new UseCaseError("Failed to update game description"),
      };
    }

    return { success: true, data: undefined };
  }

  private applyEndTimeUpdate(
    game: PredictionGame,
    request: UpdatePredictionGameRequest,
    isCreated: boolean,
    changes: UpdateChangeSet
  ): Result<void, UseCaseError> {
    const { endTime } = request.updates;
    if (!endTime || !isCreated) {
      return { success: true, data: undefined };
    }

    changes.previousValues.endTime = game.endTime;
    changes.newValues.endTime = endTime;
    changes.updatedFields.push("endTime");

    const updateResult = game.updateEndTime(endTime);
    if (isFailure(updateResult)) {
      return {
        success: false,
        error: new UseCaseError("Failed to update game end time"),
      };
    }

    return { success: true, data: undefined };
  }

  private applySettlementTimeUpdate(
    game: PredictionGame,
    request: UpdatePredictionGameRequest,
    isCreated: boolean,
    changes: UpdateChangeSet
  ): Result<void, UseCaseError> {
    const { settlementTime } = request.updates;
    if (!settlementTime || !isCreated) {
      return { success: true, data: undefined };
    }

    changes.previousValues.settlementTime = game.settlementTime;
    changes.newValues.settlementTime = settlementTime;
    changes.updatedFields.push("settlementTime");

    const updateResult = game.updateSettlementTime(settlementTime);
    if (isFailure(updateResult)) {
      return {
        success: false,
        error: new UseCaseError("Failed to update game settlement time"),
      };
    }

    return { success: true, data: undefined };
  }

  private applyOptionsUpdate(
    game: PredictionGame,
    request: UpdatePredictionGameRequest,
    isCreated: boolean,
    changes: UpdateChangeSet
  ): Result<void, UseCaseError> {
    const { options } = request.updates;
    if (!options || !isCreated) {
      return { success: true, data: undefined };
    }

    const gameStats = game.getStatistics();
    if (gameStats.totalParticipants !== 0) {
      return {
        success: false,
        error: new UseCaseError("Cannot update options after participants joined"),
      };
    }

    changes.previousValues.options = game.options;
    changes.newValues.options = options;
    changes.updatedFields.push("options");

    return { success: true, data: undefined };
  }

  private applyMetadataUpdate(
    request: UpdatePredictionGameRequest,
    changes: UpdateChangeSet
  ): Result<void, UseCaseError> {
    const { metadata } = request.updates;
    if (!metadata) {
      return { success: true, data: undefined };
    }

    changes.previousValues.metadata = {};
    changes.newValues.metadata = metadata;
    changes.updatedFields.push("metadata");

    return { success: true, data: undefined };
  }

  private applyMinimumStakeUpdate(
    game: PredictionGame,
    request: UpdatePredictionGameRequest,
    isCreated: boolean,
    changes: UpdateChangeSet
  ): Result<void, UseCaseError> {
    const { minimumStake } = request.updates;
    if (minimumStake === undefined || !isCreated) {
      return { success: true, data: undefined };
    }

    changes.previousValues.minimumStake = game.minimumStake;
    changes.newValues.minimumStake = minimumStake;
    changes.updatedFields.push("minimumStake");

    return { success: true, data: undefined };
  }

  private applyMaximumStakeUpdate(
    game: PredictionGame,
    request: UpdatePredictionGameRequest,
    isCreated: boolean,
    changes: UpdateChangeSet
  ): Result<void, UseCaseError> {
    const { maximumStake } = request.updates;
    if (maximumStake === undefined || !isCreated) {
      return { success: true, data: undefined };
    }

    changes.previousValues.maximumStake = game.maximumStake;
    changes.newValues.maximumStake = maximumStake;
    changes.updatedFields.push("maximumStake");

    return { success: true, data: undefined };
  }

  private applyMaxParticipantsUpdate(
    game: PredictionGame,
    request: UpdatePredictionGameRequest,
    isCreated: boolean,
    changes: UpdateChangeSet
  ): Result<void, UseCaseError> {
    const { maxParticipants } = request.updates;
    if (maxParticipants === undefined || !isCreated) {
      return { success: true, data: undefined };
    }

    changes.previousValues.maxParticipants = game.maxParticipants;
    changes.newValues.maxParticipants = maxParticipants;
    changes.updatedFields.push("maxParticipants");

    return { success: true, data: undefined };
  }
}
