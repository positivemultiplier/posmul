import {
  AccuracyScore,
  DomainError,
  PmpAmount,
  PredictionGameId,
  PredictionId,
  PredictionResult as PredictionResultEnum,
  Result,
  Timestamps,
  UserId,
  ValidationError,
  createPredictionGameId,
  failure,
  success,
} from "@posmul/shared-types";
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
        error: new ValidationError(
          "Title must be at least 5 characters",
          "title"
        ),
      };
    }
    if (props.startTime >= props.endTime) {
      return {
        success: false,
        error: new ValidationError(
          "Start time must be before end time",
          "startTime"
        ),
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
        new DomainError(
          "Predictions can only be added to active games",
          "GAME_NOT_ACTIVE"
        )
      );
    }
    if (
      this._maxParticipants &&
      this._predictions.length >= this._maxParticipants
    ) {
      return failure(
        new DomainError("Game has reached max participants", "MAX_PARTICIPANTS")
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
        new DomainError(
          "Game must be in 'ENDED' state to be settled",
          "SETTLEMENT_INVALID_STATE"
        )
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

  // Getters
  get creatorId(): UserId {
    return this._creatorId;
  }
  get title(): string {
    return this._title;
  }
  get status(): GameStatus {
    return this._status;
  }
  get predictions(): readonly Prediction[] {
    return this._predictions;
  }
  get timestamps(): Timestamps {
    return this._timestamps;
  }
}
