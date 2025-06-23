/**
 * Prediction Game Aggregate
 *
 * PosMul 플랫폼의 핵심 도메인 객체로, 예측 게임의 전체 생명주기를 관리합니다.
 * Agency Theory와 CAPM 모델을 적용하여 정보 비대칭을 해결하는 메커니즘을 제공합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import {
  AccuracyScore,
  PMC,
  PMP,
  PredictionGameId,
  PredictionId,
  UserId,
  createPredictionGameId,
  createPredictionId,
} from "@/shared/types/branded-types";
import {
  DomainError,
  Result,
  Timestamps,
  ValidationError,
  failure,
  success,
} from "@/shared/types/economic-system";
import { GameStatus } from "../value-objects/game-status";
import { PredictionResult } from "../value-objects/prediction-types";

/**
 * 예측 타입 정의
 */
export enum PredictionType {
  BINARY = "binary", // 예/아니오
  WIN_DRAW_LOSE = "wdl", // 승/무/패
  RANKING = "ranking", // 순위 예측
}

/**
 * 예측 옵션 인터페이스
 */
export interface PredictionOption {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly odds?: number; // 배당률
}

/**
 * 게임 설정 인터페이스
 */
export interface GameConfiguration {
  readonly title: string;
  readonly description: string;
  readonly predictionType: PredictionType;
  readonly options: PredictionOption[];
  readonly startTime: Date;
  readonly endTime: Date;
  readonly settlementTime: Date;
  readonly minimumStake: PMP;
  readonly maximumStake: PMP;
  readonly maxParticipants?: number;
}

/**
 * 예측 엔티티
 */
export class Prediction {
  private constructor(
    private readonly _id: PredictionId,
    private readonly _userId: UserId,
    private readonly _gameId: PredictionGameId,
    private readonly _selectedOptionId: string,
    private readonly _stake: PMP,
    private readonly _confidence: number, // 0-1 범위
    private readonly _reasoning?: string,
    private _result?: PredictionResult,
    private _accuracyScore?: AccuracyScore,
    private _reward?: PMC,
    private readonly _timestamps: Timestamps = {
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ) {
    this.validateConfidence();
  }

  /**
   * 예측 생성 팩토리 메서드
   */
  public static create(
    userId: UserId,
    gameId: PredictionGameId,
    selectedOptionId: string,
    stake: PMP,
    confidence: number,
    reasoning?: string
  ): Result<Prediction, ValidationError | DomainError> {
    if (confidence < 0 || confidence > 1) {
      return failure(
        new ValidationError("Confidence must be between 0 and 1", "confidence")
      );
    }

    if (Number.isNaN(stake) || stake <= 0) {
      return failure(new ValidationError("Stake must be positive", "stake"));
    }

    const predictionId = createPredictionId(crypto.randomUUID());

    const prediction = new Prediction(
      predictionId,
      userId,
      gameId,
      selectedOptionId,
      stake,
      confidence,
      reasoning
    );

    return success(prediction);
  }

  /**
   * 예측 결과 설정
   */
  public setResult(
    result: PredictionResult,
    accuracyScore: AccuracyScore,
    reward: PMC
  ): Result<void, DomainError> {
    if (this._result !== undefined) {
      return failure(
        new DomainError("Prediction result already set", "RESULT_ALREADY_SET")
      );
    }

    this._result = result;
    this._accuracyScore = accuracyScore;
    this._reward = reward;

    return success(undefined);
  }

  private validateConfidence(): void {
    if (this._confidence < 0 || this._confidence > 1) {
      throw new ValidationError(
        "Confidence must be between 0 and 1",
        "confidence"
      );
    }
  }

  // Getters
  public get id(): PredictionId {
    return this._id;
  }
  public get userId(): UserId {
    return this._userId;
  }
  public get gameId(): PredictionGameId {
    return this._gameId;
  }
  public get selectedOptionId(): string {
    return this._selectedOptionId;
  }
  public get stake(): PMP {
    return this._stake;
  }
  public get confidence(): number {
    return this._confidence;
  }
  public get reasoning(): string | undefined {
    return this._reasoning;
  }
  public get result(): PredictionResult | undefined {
    return this._result;
  }
  public get accuracyScore(): AccuracyScore | undefined {
    return this._accuracyScore;
  }
  public get reward(): PMC | undefined {
    return this._reward;
  }
  public get timestamps(): Timestamps {
    return this._timestamps;
  }

  /**
   * 영속성 데이터로부터 Prediction 엔티티 재구성
   */
  public static fromPersistence(data: {
    id: PredictionId;
    userId: UserId;
    gameId: PredictionGameId;
    selectedOptionId: string;
    stake: PMP;
    confidence: number;
    reasoning?: string;
    result?: PredictionResult;
    accuracyScore?: AccuracyScore;
    reward?: PMC;
    timestamps: Timestamps;
  }): Prediction {
    return new Prediction(
      data.id,
      data.userId,
      data.gameId,
      data.selectedOptionId,
      data.stake,
      data.confidence,
      data.reasoning,
      data.result,
      data.accuracyScore,
      data.reward,
      data.timestamps
    );
  }
}

/**
 * 게임 통계 인터페이스
 */
export interface GameStatistics {
  readonly totalParticipants: number;
  readonly totalStake: PMP;
  readonly averageConfidence: number;
  readonly optionDistribution: Map<string, number>;
}

/**
 * PredictionGame Aggregate Root
 */
export class PredictionGame {
  private readonly _predictions: Map<PredictionId, Prediction> = new Map();
  private _status: GameStatus = GameStatus.CREATED;

  private constructor(
    private readonly _id: PredictionGameId,
    private readonly _creatorId: UserId,
    private readonly _configuration: GameConfiguration,
    private readonly _timestamps: Timestamps = {
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ) {
    this.validateConfiguration();
  }

  /**
   * 예측 게임 생성 팩토리 메서드
   */
  public static create(
    creatorId: UserId,
    configuration: GameConfiguration
  ): Result<PredictionGame, ValidationError | DomainError> {
    const gameId = createPredictionGameId(crypto.randomUUID());

    const validationResult =
      PredictionGame.validateGameConfiguration(configuration);
    if (!validationResult.success) {
      return validationResult;
    }

    const game = new PredictionGame(gameId, creatorId, configuration);
    return success(game);
  }

  /**
   * 게임 시작
   */
  public start(): Result<void, DomainError> {
    if (this._status !== GameStatus.CREATED) {
      return failure(
        new DomainError(
          "Game can only be started from PENDING status",
          "INVALID_STATUS_TRANSITION"
        )
      );
    }

    const now = new Date();
    if (now < this._configuration.startTime) {
      return failure(
        new DomainError(
          "Game cannot be started before start time",
          "INVALID_START_TIME"
        )
      );
    }

    this._status = GameStatus.ACTIVE;
    return success(undefined);
  }

  /**
   * 예측 추가
   */
  public addPrediction(
    userId: UserId,
    selectedOptionId: string,
    stake: PMP,
    confidence: number,
    reasoning?: string
  ): Result<PredictionId, DomainError> {
    // 게임 상태 검증
    if (this._status !== GameStatus.ACTIVE) {
      return failure(
        new DomainError(
          "Predictions can only be added to active games",
          "GAME_NOT_ACTIVE"
        )
      );
    }

    // 시간 검증
    const now = new Date();
    if (now > this._configuration.endTime) {
      return failure(
        new DomainError(
          "Prediction period has ended",
          "PREDICTION_PERIOD_ENDED"
        )
      );
    }

    // 스테이크 검증
    if (
      stake < this._configuration.minimumStake ||
      stake > this._configuration.maximumStake
    ) {
      return failure(
        new DomainError(
          "Stake amount is outside allowed range",
          "INVALID_STAKE_AMOUNT"
        )
      );
    }

    // 옵션 유효성 검증
    const validOption = this._configuration.options.find(
      (opt) => opt.id === selectedOptionId
    );
    if (!validOption) {
      return failure(
        new DomainError("Invalid prediction option", "INVALID_OPTION")
      );
    }

    // 중복 참여 검증
    const existingPrediction = Array.from(this._predictions.values()).find(
      (p) => p.userId === userId
    );
    if (existingPrediction) {
      return failure(
        new DomainError(
          "User already has a prediction for this game",
          "DUPLICATE_PREDICTION"
        )
      );
    }

    // 최대 참여자 수 검증
    if (
      this._configuration.maxParticipants &&
      this._predictions.size >= this._configuration.maxParticipants
    ) {
      return failure(
        new DomainError(
          "Maximum number of participants reached",
          "MAX_PARTICIPANTS_REACHED"
        )
      );
    }

    // 예측 생성
    const predictionResult = Prediction.create(
      userId,
      this._id,
      selectedOptionId,
      stake,
      confidence,
      reasoning
    );

    if (!predictionResult.success) {
      return failure(predictionResult.error);
    }

    this._predictions.set(predictionResult.data.id, predictionResult.data);

    return success(predictionResult.data.id);
  }

  /**
   * 게임 종료 (예측 접수 마감)
   */
  public endPredictionPeriod(): Result<void, DomainError> {
    if (this._status !== GameStatus.ACTIVE) {
      return failure(
        new DomainError(
          "Only active games can end prediction period",
          "INVALID_STATUS_TRANSITION"
        )
      );
    }

    const now = new Date();
    if (now < this._configuration.endTime) {
      return failure(
        new DomainError(
          "Cannot end prediction period before scheduled end time",
          "EARLY_END_ATTEMPT"
        )
      );
    }

    this._status = GameStatus.ENDED;
    return success(undefined);
  }

  /**
   * 게임 결과 확정 및 보상 분배
   */
  public settleGame(
    correctOptionId: string,
    accuracyCalculator: (
      prediction: Prediction,
      isCorrect: boolean
    ) => AccuracyScore,
    rewardCalculator: (
      prediction: Prediction,
      accuracy: AccuracyScore,
      totalPool: PMP
    ) => PMC
  ): Result<void, DomainError> {
    if (this._status !== GameStatus.ENDED) {
      return failure(
        new DomainError(
          "Game must be in EVALUATING status to settle",
          "INVALID_STATUS_TRANSITION"
        )
      );
    }

    const now = new Date();
    if (now < this._configuration.settlementTime) {
      return failure(
        new DomainError(
          "Cannot settle game before settlement time",
          "EARLY_SETTLEMENT_ATTEMPT"
        )
      );
    }

    // 올바른 옵션 확인
    const correctOption = this._configuration.options.find(
      (opt) => opt.id === correctOptionId
    );
    if (!correctOption) {
      return failure(
        new DomainError("Invalid correct option ID", "INVALID_CORRECT_OPTION")
      );
    }

    // 총 스테이크 풀 계산
    const totalPool = Array.from(this._predictions.values()).reduce(
      (sum, p) => (sum + p.stake) as PMP,
      0 as PMP
    ); // 각 예측의 결과 및 보상 계산
    for (const prediction of this._predictions.values()) {
      const isCorrect = prediction.selectedOptionId === correctOptionId;
      const result: PredictionResult = {
        predictionId: prediction.id,
        userId: prediction.userId,
        selectedOptionId: prediction.selectedOptionId,
        confidence: prediction.confidence,
        stakeAmount: prediction.stake,
        isCorrect,
        accuracyScore: undefined, // Will be set below
        rewardAmount: undefined, // Will be set below
      };

      const accuracy = accuracyCalculator(prediction, isCorrect);
      const reward = rewardCalculator(prediction, accuracy, totalPool);

      // Update the result with calculated values
      result.accuracyScore = accuracy;
      result.rewardAmount = reward;

      const setResultResult = prediction.setResult(result, accuracy, reward);
      if (!setResultResult.success) {
        return failure(setResultResult.error);
      }
    }

    this._status = GameStatus.SETTLED;
    return success(undefined);
  }

  /**
   * 게임 취소
   */ public cancel(): Result<void, DomainError> {
    if (this._status === GameStatus.SETTLED) {
      return failure(
        new DomainError(
          "Cannot cancel completed game",
          "CANNOT_CANCEL_COMPLETED"
        )
      );
    }

    // 취소된 게임은 CREATED 상태로 되돌림 (도메인에 CANCELLED가 없음)
    this._status = GameStatus.CREATED;
    return success(undefined);
  }

  /**
   * 게임 통계 계산
   */
  public getStatistics(): GameStatistics {
    const predictions = Array.from(this._predictions.values());

    const totalParticipants = predictions.length;
    const totalStake = predictions.reduce(
      (sum, p) => (sum + p.stake) as PMP,
      0 as PMP
    );
    const averageConfidence =
      totalParticipants > 0
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) /
          totalParticipants
        : 0;

    const optionDistribution = new Map<string, number>();
    predictions.forEach((p) => {
      const count = optionDistribution.get(p.selectedOptionId) || 0;
      optionDistribution.set(p.selectedOptionId, count + 1);
    });

    return {
      totalParticipants,
      totalStake,
      averageConfidence,
      optionDistribution,
    };
  }

  /**
   * 게임 설정 유효성 검증
   */
  private static validateGameConfiguration(
    config: GameConfiguration
  ): Result<void, ValidationError | DomainError> {
    if (!config.title || config.title.trim().length === 0) {
      return failure(new ValidationError("Game title is required", "title"));
    }

    if (config.options.length < 2) {
      return failure(
        new ValidationError("Game must have at least 2 options", "options")
      );
    }

    if (config.startTime >= config.endTime) {
      return failure(
        new ValidationError("Start time must be before end time", "startTime")
      );
    }

    if (config.endTime >= config.settlementTime) {
      return failure(
        new ValidationError(
          "End time must be before settlement time",
          "endTime"
        )
      );
    }

    if (config.minimumStake >= config.maximumStake) {
      return failure(
        new ValidationError(
          "Minimum stake must be less than maximum stake",
          "minimumStake"
        )
      );
    }

    return success(undefined);
  }

  private validateConfiguration(): void {
    const result = PredictionGame.validateGameConfiguration(
      this._configuration
    );
    if (!result.success) {
      throw result.error;
    }
  }

  // Getters
  public get id(): PredictionGameId {
    return this._id;
  }
  public get creatorId(): UserId {
    return this._creatorId;
  }
  public get configuration(): GameConfiguration {
    return this._configuration;
  }
  public get status(): GameStatus {
    return this._status;
  }
  public get predictions(): ReadonlyMap<PredictionId, Prediction> {
    return this._predictions;
  }
  public get timestamps(): Timestamps {
    return this._timestamps;
  }

  /**
   * 특정 사용자의 예측 조회
   */
  public getPredictionByUser(userId: UserId): Prediction | undefined {
    return Array.from(this._predictions.values()).find(
      (p) => p.userId === userId
    );
  }

  /**
   * 게임 제목 조회
   */
  public getTitle(): string {
    return this._configuration.title;
  }

  /**
   * 게임 설명 조회
   */
  public getDescription(): string {
    return this._configuration.description;
  }

  /**
   * 예측 타입 조회
   */
  public getPredictionType(): PredictionType {
    return this._configuration.predictionType;
  }

  /**
   * 예측 옵션들 조회
   */
  public getOptions(): PredictionOption[] {
    return this._configuration.options;
  }

  /**
   * 게임 시작 시간 조회
   */
  public getStartTime(): Date {
    return this._configuration.startTime;
  }

  /**
   * 게임 종료 시간 조회
   */
  public getEndTime(): Date {
    return this._configuration.endTime;
  }

  /**
   * 정산 시간 조회
   */
  public getSettlementTime(): Date {
    return this._configuration.settlementTime;
  }

  /**
   * 생성자 ID 조회
   */
  public getCreatedBy(): UserId {
    return this._creatorId;
  }

  /**
   * 게임 버전 조회
   */
  public getVersion(): number {
    // 현재 구조에서는 버전 관리가 없으므로 기본값 반환
    return 1;
  }

  /**
   * 생성 시간 조회
   */
  public getCreatedAt(): Date {
    return this._timestamps.createdAt;
  }

  /**
   * 수정 시간 조회
   */
  public getUpdatedAt(): Date {
    return this._timestamps.updatedAt;
  }

  /**
   * 최소 스테이크 조회
   */
  public getMinimumStake(): PMP {
    return this._configuration.minimumStake;
  }

  /**
   * 최대 스테이크 조회
   */
  public getMaximumStake(): PMP {
    return this._configuration.maximumStake;
  }

  /**
   * 최대 참여자 수 조회
   */
  public getMaxParticipants(): number | undefined {
    return this._configuration.maxParticipants;
  }

  /**
   * 게임 제목 업데이트
   */
  public updateTitle(newTitle: string): Result<void, ValidationError> {
    if (!newTitle || newTitle.trim().length === 0) {
      return failure(new ValidationError("Title cannot be empty", "title"));
    }

    // configuration은 readonly이므로 새로운 객체 생성
    (this._configuration as any).title = newTitle;
    return { success: true, data: undefined } as Result<void, ValidationError>;
  }

  /**
   * 게임 설명 업데이트
   */
  public updateDescription(
    newDescription: string
  ): Result<void, ValidationError> {
    (this._configuration as any).description = newDescription;
    return { success: true, data: undefined } as Result<void, ValidationError>;
  }

  /**
   * 종료 시간 업데이트
   */
  public updateEndTime(newEndTime: Date): Result<void, ValidationError> {
    if (newEndTime <= this._configuration.startTime) {
      return failure(
        new ValidationError("End time must be after start time", "endTime")
      );
    }

    if (newEndTime >= this._configuration.settlementTime) {
      return failure(
        new ValidationError(
          "End time must be before settlement time",
          "endTime"
        )
      );
    }

    (this._configuration as any).endTime = newEndTime;
    return { success: true, data: undefined } as Result<void, ValidationError>;
  }

  /**
   * 정산 시간 업데이트
   */
  public updateSettlementTime(
    newSettlementTime: Date
  ): Result<void, ValidationError> {
    if (newSettlementTime <= this._configuration.endTime) {
      return failure(
        new ValidationError(
          "Settlement time must be after end time",
          "settlementTime"
        )
      );
    }

    (this._configuration as any).settlementTime = newSettlementTime;
    return { success: true, data: undefined } as Result<void, ValidationError>;
  }

  /**
   * 최소 스테이크 업데이트
   */
  public updateMinimumStake(
    newMinimumStake: PMP
  ): Result<void, ValidationError> {
    if (newMinimumStake >= this._configuration.maximumStake) {
      return failure(
        new ValidationError(
          "Minimum stake must be less than maximum stake",
          "minimumStake"
        )
      );
    }

    (this._configuration as any).minimumStake = newMinimumStake;
    return { success: true, data: undefined } as Result<void, ValidationError>;
  }

  /**
   * 최대 스테이크 업데이트
   */
  public updateMaximumStake(
    newMaximumStake: PMP
  ): Result<void, ValidationError> {
    if (newMaximumStake <= this._configuration.minimumStake) {
      return failure(
        new ValidationError(
          "Maximum stake must be greater than minimum stake",
          "maximumStake"
        )
      );
    }

    (this._configuration as any).maximumStake = newMaximumStake;
    return { success: true, data: undefined } as Result<void, ValidationError>;
  }

  /**
   * 최대 참여자 수 업데이트
   */
  public updateMaxParticipants(
    newMaxParticipants: number
  ): Result<void, ValidationError> {
    if (newMaxParticipants <= 0) {
      return failure(
        new ValidationError(
          "Max participants must be positive",
          "maxParticipants"
        )
      );
    }

    (this._configuration as any).maxParticipants = newMaxParticipants;
    return { success: true, data: undefined } as Result<void, ValidationError>;
  }

  /**
   * 게임 삭제 마크 (소프트 삭제)
   */
  public markAsDeleted(
    deletedBy: UserId,
    reason: string
  ): Result<void, DomainError> {
    if (this._status === GameStatus.SETTLED) {
      return failure(
        new DomainError(
          "Cannot delete completed game",
          "CANNOT_DELETE_COMPLETED"
        )
      );
    }

    this._status = GameStatus.CREATED; // DELETED 상태가 없으므로 CREATED 사용
    return success(undefined);
  }

  /**
   * 게임 활성 상태 확인
   */
  public isActive(): boolean {
    return (
      this._status === GameStatus.ACTIVE &&
      new Date() <= this._configuration.endTime
    );
  }

  /**
   * 게임 완료 상태 확인
   */ public isCompleted(): boolean {
    return this._status === GameStatus.SETTLED;
  }

  /**
   * 영속성 데이터로부터 PredictionGame Aggregate 재구성
   */
  public static fromPersistence(data: {
    id: PredictionGameId;
    creatorId: UserId;
    configuration: GameConfiguration;
    status: GameStatus;
    predictions: Map<PredictionId, Prediction>;
    timestamps: Timestamps;
  }): PredictionGame {
    const game = new PredictionGame(
      data.id,
      data.creatorId,
      data.configuration,
      data.timestamps
    );
    game._status = data.status;

    // Using a private field directly is not ideal, but necessary for reconstruction
    // if there's no public method to set predictions.
    (game as any)._predictions = data.predictions;

    return game;
  }
}
