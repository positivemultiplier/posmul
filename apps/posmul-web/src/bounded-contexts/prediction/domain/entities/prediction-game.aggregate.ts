import { PredictionGameId, PredictionId, Result, UserId } from "@posmul/auth-economy-sdk";
import { AccuracyScore, ValidationError, failure, success, DomainError } from "@posmul/auth-economy-sdk";
import { PmpAmount } from "@posmul/auth-economy-sdk/economy";
import { Timestamps, createPredictionGameId, PredictionResult as PredictionResultEnum } from "../types/common";
import { AggregateRoot } from "../../../../shared/domain/aggregate-root";
import {
  GameOptions,
  GameStatus,
  PredictionType,
} from "../value-objects/prediction-types";
import { Prediction } from "./prediction.entity";

export class PredictionGame extends AggregateRoot<PredictionGameId> {
  private _creatorId: UserId;
  private _title: string;
  private _description: string;
  private _predictionType: PredictionType;
  private _options: GameOptions;
  private _startTime: Date;
  private _endTime: Date;
  private _settlementTime: Date;
  private _minimumStake: PmpAmount;
  private _maximumStake: PmpAmount;
  private _maxParticipants: number | null;
  private _status: GameStatus;
  private _gameImportanceScore: number;
  private _allocatedPrizePool: PmpAmount;
  private _timestamps: Timestamps;
  private _version: number;
  private _predictions: Prediction[];
  private _isDeleted: boolean = false;

  private constructor(
    id: PredictionGameId,
    props: {
      creatorId: UserId;
      title: string;
      description: string;
      predictionType: PredictionType;
      options: GameOptions;
      startTime: Date;
      endTime: Date;
      settlementTime: Date;
      minimumStake?: PmpAmount;
      maximumStake?: PmpAmount;
      maxParticipants?: number | null;
      status?: GameStatus;
      gameImportanceScore?: number;
      allocatedPrizePool?: PmpAmount;
      timestamps?: Timestamps;
      version?: number;
      predictions?: Prediction[];
    }
  ) {
    super(id);
    this._creatorId = props.creatorId;
    this._title = props.title;
    this._description = props.description;
    this._predictionType = props.predictionType;
    this._options = props.options;
    this._startTime = props.startTime;
    this._endTime = props.endTime;
    this._settlementTime = props.settlementTime;
    this._minimumStake = props.minimumStake ?? (0 as PmpAmount);
    this._maximumStake = props.maximumStake ?? (1000 as PmpAmount);
    this._maxParticipants = props.maxParticipants ?? null;
    this._status = props.status ?? "CREATED";
    this._gameImportanceScore = props.gameImportanceScore ?? 1.0;
    this._allocatedPrizePool = props.allocatedPrizePool ?? (0 as PmpAmount);
    this._timestamps = props.timestamps ?? {
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this._version = props.version ?? 1;
    this._predictions = props.predictions ?? [];
    this._isDeleted = false;
  }

  public static create(props: {
    creatorId: UserId;
    title: string;
    description: string;
    predictionType: PredictionType;
    options: GameOptions;
    startTime: Date;
    endTime: Date;
    settlementTime: Date;
    minimumStake?: PmpAmount;
    maximumStake?: PmpAmount;
    maxParticipants?: number;
  }): Result<PredictionGame, ValidationError> {
    if (props.title.length < 5) {
      return {
        success: false,
        error: new ValidationError("Title must be at least 5 characters", { field: "title" }),
      };
    }
    if (props.startTime >= props.endTime) {
      return {
        success: false,
        error: new ValidationError("Start time must be before end time", { field: "startTime" }),
      };
    }

    const id = createPredictionGameId(crypto.randomUUID());
    const game = new PredictionGame(id, props);

    // The event constructor in domain-events.ts expects different params
    // I'll create a more specific event for this bounded context for now
    // game.addDomainEvent(new PredictionGameCreatedEvent(id, props.creatorId));

    return success(game);
  }

  public addPrediction(prediction: Prediction): Result<void, DomainError> {
    if (this._status !== "ACTIVE") {
      return failure(
        new DomainError("Predictions can only be added to active games", { code: "GAME_NOT_ACTIVE" })
      );
    }
    if (
      this._maxParticipants &&
      this._predictions.length >= this._maxParticipants
    ) {
      return failure(
        new DomainError("Game has reached max participants", { code: "MAX_PARTICIPANTS" })
      );
    }
    this._predictions.push(prediction);
    return success(undefined);
  }

  public getPrediction(predictionId: PredictionId): Prediction | undefined {
    return this._predictions.find((p) => p.id === predictionId);
  }

  public settle(
    correctOptionId: string
    // IUserRepository is not actually used, removing for now to reduce dependencies
  ): Result<void, DomainError> {
    if (this._status !== "ENDED") {
      return failure(
        new DomainError("Game must be in 'ENDED' state to be settled", { code: "SETTLEMENT_INVALID_STATE" })
      );
    }

    const winningPredictions = this._predictions.filter(
      (p) => p.selectedOptionId === correctOptionId
    );
    const losingPredictions = this._predictions.filter(
      (p) => p.selectedOptionId !== correctOptionId
    );

    const totalStake = this._predictions.reduce((sum, p) => sum + p.stake, 0);

    if (winningPredictions.length > 0) {
      const totalWinningStake = winningPredictions.reduce(
        (sum, p) => sum + p.stake,
        0
      );
      for (const prediction of winningPredictions) {
        const reward = (prediction.stake / totalWinningStake) * totalStake;
        prediction.setResult({
          result: PredictionResultEnum.CORRECT,
          accuracyScore: 1 as AccuracyScore, // Simplified
          reward: reward as PmpAmount,
        });
      }
    }

    for (const prediction of losingPredictions) {
      prediction.setResult({
        result: PredictionResultEnum.INCORRECT,
        accuracyScore: 0 as AccuracyScore,
        reward: 0 as PmpAmount,
      });
    }

    this._status = "COMPLETED";
    return success(undefined);
  }

  /**
   * 게임의 기본 통계 정보를 계산하여 반환
   */
  public getStatistics(): {
    totalParticipants: number;
    totalStake: number;
    averageConfidence: number;
    optionDistribution: Map<string, number>;
  } {
    const totalParticipants = this._predictions.length;
    const totalStake = this._predictions.reduce(
      (sum, p) => sum + p.stake,
      0 as PmpAmount
    );

    const totalConfidence = this._predictions.reduce(
      (sum, p) => sum + p.confidence,
      0
    );

    const averageConfidence =
      totalParticipants > 0 ? totalConfidence / totalParticipants : 0;

    const optionDistribution = new Map<string, number>();
    for (const p of this._predictions) {
      optionDistribution.set(
        p.selectedOptionId,
        (optionDistribution.get(p.selectedOptionId) || 0) + 1
      );
    }

    return {
      totalParticipants,
      totalStake,
      averageConfidence,
      optionDistribution,
    };
  }

  // Getters
  get creatorId(): UserId {
    return this._creatorId;
  }
  get title(): string {
    return this._title;
  }
  get status(): {
    value: GameStatus;
    isActive(): boolean;
    isEnded(): boolean;
    isSettled(): boolean;
    isCreated(): boolean;
    toString(): GameStatus;
  } {
    const value = this._status;
    return {
      value,
      isActive: () => value === "ACTIVE",
      isEnded: () => value === "ENDED",
      isSettled: () => value === "COMPLETED" || value === "CANCELLED",
      isCreated: () => value === "CREATED",
      toString: () => value,
    };
  }
  get predictions(): readonly Prediction[] {
    return this._predictions;
  }
  get timestamps(): Timestamps {
    return this._timestamps;
  }

  /** Getter / Mutator helpers **/

  get description(): string {
    return this._description;
  }

  get predictionType(): PredictionType {
    return this._predictionType;
  }

  get startTime(): Date {
    return this._startTime;
  }

  get endTime(): Date {
    return this._endTime;
  }

  get settlementTime(): Date {
    return this._settlementTime;
  }

  get createdAt(): Date {
    return this._timestamps.createdAt;
  }

  /** Title / Description 변경 (게임이 아직 시작 전 상태에서만) */
  public updateTitle(newTitle: string): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(
        new DomainError("Cannot update title after game has started", { code: "GAME_ALREADY_STARTED" })
      );
    }
    if (newTitle.length < 5) {
      return failure(
        new DomainError("Title must be at least 5 characters", { code: "TITLE_TOO_SHORT" })
      );
    }
    this._title = newTitle;
    this.touch();
    return success(undefined);
  }

  public updateDescription(newDescription: string): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(
        new DomainError("Cannot update description after game has started", { code: "GAME_ALREADY_STARTED" })
      );
    }
    if (newDescription.length < 10) {
      return failure(
        new DomainError("Description must be at least 10 characters", { code: "DESCRIPTION_TOO_SHORT" })
      );
    }
    this._description = newDescription;
    this.touch();
    return success(undefined);
  }

  public updateEndTime(newEndTime: Date): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(new DomainError("Cannot update end time after start", { code: "GAME_ALREADY_STARTED" }));
    }
    if (newEndTime <= this._startTime) {
      return failure(
        new DomainError("End time must be after start time", { code: "INVALID_END_TIME" })
      );
    }
    this._endTime = newEndTime;
    this.touch();
    return success(undefined);
  }

  public updateSettlementTime(
    newSettlementTime: Date
  ): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(
        new DomainError("Cannot update settlement time after start", { code: "GAME_ALREADY_STARTED" })
      );
    }
    if (newSettlementTime <= this._endTime) {
      return failure(
        new DomainError("Settlement time must be after end time", { code: "INVALID_SETTLEMENT_TIME" })
      );
    }
    this._settlementTime = newSettlementTime;
    this.touch();
    return success(undefined);
  }

  public updateMinimumStake(newMin: PmpAmount): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(new DomainError("Cannot change stake after start", { code: "GAME_ALREADY_STARTED" }));
    }
    if (newMin < 0) {
      return failure(
        new DomainError("Minimum stake cannot be negative", { code: "NEGATIVE_STAKE" })
      );
    }
    this._minimumStake = newMin;
    this.touch();
    return success(undefined);
  }

  public updateMaximumStake(newMax: PmpAmount): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(new DomainError("Cannot change stake after start", { code: "GAME_ALREADY_STARTED" }));
    }
    if (newMax <= this._minimumStake) {
      return failure(
        new DomainError("Maximum stake must be greater than minimum stake", { code: "INVALID_MAX_STAKE" })
      );
    }
    this._maximumStake = newMax;
    this.touch();
    return success(undefined);
  }

  public updateMaxParticipants(newMax: number): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(new DomainError("Cannot change participants after start", { code: "GAME_ALREADY_STARTED" }));
    }
    if (newMax <= 0) {
      return failure(
        new DomainError("Max participants must be positive", { code: "INVALID_MAX_PARTICIPANTS" })
      );
    }
    this._maxParticipants = newMax;
    this.touch();
    return success(undefined);
  }

  public markAsDeleted(): void {
    this._isDeleted = true;
    this.touch();
  }

  /** Helper to update timestamp & version */
  private touch() {
    this._timestamps = {
      ...this._timestamps,
      updatedAt: new Date(),
    } as Timestamps;
    this._version += 1;
  }

  // Additional getters
  get options(): GameOptions {
    return this._options;
  }

  get minimumStake(): PmpAmount {
    return this._minimumStake;
  }

  get maximumStake(): PmpAmount {
    return this._maximumStake;
  }

  get maxParticipants(): number | null {
    return this._maxParticipants;
  }

  get version(): number {
    return this._version;
  }

  /* ------------------------------------------------------------------------- */
  /* 🛠️  Legacy alias getters (backward compatibility with existing use-cases) */
  /* ------------------------------------------------------------------------- */

  public getStartTime(): Date {
    return this._startTime;
  }

  public getEndTime(): Date {
    return this._endTime;
  }

  public getSettlementTime(): Date {
    return this._settlementTime;
  }

  public getCreatedBy(): UserId {
    return this._creatorId;
  }

  public getCreatedAt(): Date {
    return this._timestamps.createdAt;
  }

  public getUpdatedAt(): Date {
    return this._timestamps.updatedAt;
  }

  public getVersion(): number {
    return this._version;
  }

  /**
   * Aggregated immutable configuration snapshot.
   * Used by repositories & presentation mappers.
   */
  public get configuration(): GameConfiguration {
    return {
      title: this._title,
      description: this._description,
      predictionType: this._predictionType,
      options: this._options,
      startTime: this._startTime,
      endTime: this._endTime,
      settlementTime: this._settlementTime,
      minimumStake: this._minimumStake,
      maximumStake: this._maximumStake,
      maxParticipants: this._maxParticipants,
    };
  }

  // Legacy getters retained for backward-compat in older use-cases
  public getTitle(): string {
    return this._title;
  }

  public getDescription(): string {
    return this._description;
  }

  public getPredictionType(): PredictionType {
    return this._predictionType;
  }

  public getOptions(): GameOptions {
    return this._options;
  }

  // End of class
}

export { PredictionType } from "../value-objects/prediction-types";
export { Prediction } from "./prediction.entity";

// -----------------------------------------------------------------------------
// 🔧 Configuration DTO (Repository & Use-case Interop)
// -----------------------------------------------------------------------------

export interface GameConfiguration {
  title: string;
  description: string;
  predictionType: PredictionType;
  options: GameOptions;
  startTime: Date;
  endTime: Date;
  settlementTime: Date;
  minimumStake: PmpAmount;
  maximumStake: PmpAmount;
  maxParticipants: number | null;
}
