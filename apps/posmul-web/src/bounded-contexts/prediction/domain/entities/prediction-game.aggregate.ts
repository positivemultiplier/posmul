import {
  PmpAmount,
  PredictionGameId,
  Result,
  UserId,
  createPmpAmount,
  unwrapPmpAmount,
} from "@posmul/auth-economy-sdk";
import {
  AccuracyScore,
  DomainError,
  ValidationError,
  failure,
  success,
} from "@posmul/auth-economy-sdk";
import { AggregateRoot } from "@posmul/auth-economy-sdk";

import {
  PredictionResult as PredictionResultEnum,
  Timestamps,
  createPredictionGameId,
} from "../types/common";
import {
  GameOptions,
  GameStatus,
  PredictionType,
} from "../value-objects/prediction-types";
import { Prediction } from "./prediction.entity";

export class PredictionGame extends AggregateRoot {
  private _id: PredictionGameId;
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
    super();
    this._id = id;
    this._creatorId = props.creatorId;
    this._title = props.title;
    this._description = props.description;
    this._predictionType = props.predictionType;
    this._options = props.options;
    this._startTime = props.startTime;
    this._endTime = props.endTime;
    this._settlementTime = props.settlementTime;
    this._minimumStake =
      props.minimumStake ?? (createPmpAmount(0) as unknown as PmpAmount);
    this._maximumStake =
      props.maximumStake ?? (createPmpAmount(1000) as unknown as PmpAmount);
    this._maxParticipants = props.maxParticipants ?? null;
    this._status = props.status ?? GameStatus.PENDING;
    this._gameImportanceScore = props.gameImportanceScore ?? 1.0;
    this._allocatedPrizePool =
      props.allocatedPrizePool ?? (createPmpAmount(0) as unknown as PmpAmount);
    this._timestamps = props.timestamps ?? {
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // AggregateRoot에서 _version을 관리하므로 설정 불필요
    this._predictions = props.predictions ?? [];
    this._isDeleted = false;
  }

  public static create(props: {
    id?: PredictionGameId; // DB에서 로딩 시 기존 ID 사용
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
    status?: GameStatus; // DB에서 로딩 시 상태 복원용
  }): Result<PredictionGame, ValidationError> {
    if (props.title.length < 5) {
      return {
        success: false,
        error: new ValidationError("Title must be at least 5 characters", {
          field: "title",
        }),
      };
    }
    if (props.startTime >= props.endTime) {
      return {
        success: false,
        error: new ValidationError("Start time must be before end time", {
          field: "startTime",
        }),
      };
    }

    // props에 id가 있으면 기존 ID 사용 (DB에서 로딩), 없으면 새 UUID 생성
    const id = props.id ?? createPredictionGameId(crypto.randomUUID());
    const game = new PredictionGame(id, props);

    // The event constructor in domain-events.ts expects different params
    // I'll create a more specific event for this bounded context for now
    // game.addDomainEvent(new PredictionGameCreatedEvent(id, props.creatorId));

    return success(game);
  }

  public addPrediction(prediction: Prediction): Result<void, DomainError> {
    if (this._status !== GameStatus.ACTIVE) {
      return failure(new DomainError("GAME_NOT_ACTIVE"));
    }

    if (this._predictions.some((p) => p.userId === prediction.userId)) {
      return failure(new DomainError("DUPLICATE_PREDICTION"));
    }

    const hasOption = this._options.some(
      (option) => option.id === prediction.selectedOptionId
    );
    if (!hasOption) {
      return failure(new DomainError("INVALID_OPTION"));
    }

    const stake = unwrapPmpAmount(prediction.stake);
    const minStake = unwrapPmpAmount(this._minimumStake);
    const maxStake = unwrapPmpAmount(this._maximumStake);

    if (stake < minStake) {
      return failure(new DomainError("STAKE_BELOW_MINIMUM"));
    }

    if (stake > maxStake) {
      return failure(new DomainError("STAKE_ABOVE_MAXIMUM"));
    }

    if (this._maxParticipants && this._predictions.length >= this._maxParticipants) {
      return failure(new DomainError("MAX_PARTICIPANTS"));
    }

    this._predictions.push(prediction);
    return success(undefined);
  }

  public getPredictions(): readonly Prediction[] {
    return this._predictions;
  }

  public getPrediction(predictionId: string): Prediction | undefined {
    return this._predictions.find((p) => p.id === predictionId);
  }

  public settle(
    correctOptionId: string
    // IUserRepository is not actually used, removing for now to reduce dependencies
  ): Result<void, DomainError> {
    if (this._status !== GameStatus.ENDED) {
      return failure(new DomainError("SETTLEMENT_INVALID_STATE"));
    }

    const hasOption = this._options.some((option) => option.id === correctOptionId);
    if (!hasOption) {
      return failure(new DomainError("INVALID_OPTION"));
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
          reward: createPmpAmount(Math.floor(reward)) as unknown as PmpAmount,
        });
      }
    }

    for (const prediction of losingPredictions) {
      prediction.setResult({
        result: PredictionResultEnum.INCORRECT,
        accuracyScore: 0 as AccuracyScore,
        reward: createPmpAmount(0) as unknown as PmpAmount,
      });
    }

    this._status = GameStatus.COMPLETED;
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
    const totalStake = this._predictions.reduce((sum, p) => sum + p.stake, 0);

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
      return failure(new DomainError("GAME_ALREADY_STARTED"));
    }
    if (newTitle.length < 5) {
      return failure(new DomainError("TITLE_TOO_SHORT"));
    }
    this._title = newTitle;
    this.touch();
    return success(undefined);
  }

  public updateDescription(newDescription: string): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(new DomainError("GAME_ALREADY_STARTED"));
    }
    if (newDescription.length < 10) {
      return failure(new DomainError("DESCRIPTION_TOO_SHORT"));
    }
    this._description = newDescription;
    this.touch();
    return success(undefined);
  }

  public updateEndTime(newEndTime: Date): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(new DomainError("GAME_ALREADY_STARTED"));
    }
    if (newEndTime <= this._startTime) {
      return failure(new DomainError("INVALID_END_TIME"));
    }
    this._endTime = newEndTime;
    this.touch();
    return success(undefined);
  }

  public updateSettlementTime(
    newSettlementTime: Date
  ): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(new DomainError("GAME_ALREADY_STARTED"));
    }
    if (newSettlementTime <= this._endTime) {
      return failure(new DomainError("INVALID_SETTLEMENT_TIME"));
    }
    this._settlementTime = newSettlementTime;
    this.touch();
    return success(undefined);
  }

  public updateMinimumStake(newMin: PmpAmount): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(new DomainError("GAME_ALREADY_STARTED"));
    }
    if (newMin < 0) {
      return failure(new DomainError("NEGATIVE_STAKE"));
    }
    this._minimumStake = newMin;
    this.touch();
    return success(undefined);
  }

  public updateMaximumStake(newMax: PmpAmount): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(new DomainError("GAME_ALREADY_STARTED"));
    }
    if (newMax <= this._minimumStake) {
      return failure(new DomainError("INVALID_MAX_STAKE"));
    }
    this._maximumStake = newMax;
    this.touch();
    return success(undefined);
  }

  public updateMaxParticipants(newMax: number): Result<void, DomainError> {
    if (this._status !== "CREATED") {
      return failure(new DomainError("GAME_ALREADY_STARTED"));
    }
    if (newMax <= 0) {
      return failure(new DomainError("INVALID_MAX_PARTICIPANTS"));
    }
    this._maxParticipants = newMax;
    this.touch();
    return success(undefined);
  }

  public markAsDeleted(): void {
    this._isDeleted = true;
    this.touch();
  }

  /** 게임 ID 반환 */
  public getId(): PredictionGameId {
    return this._id;
  }

  /** 게임 제목 반환 */
  public getTitle(): string {
    return this._title;
  }

  /** 게임 상태 반환 */
  public getStatus(): GameStatus {
    return this._status;
  }

  /** 게임 활성화 */
  public activate(): Result<void, DomainError> {
    if (this._status !== GameStatus.PENDING) {
      return failure(new DomainError("CANNOT_ACTIVATE_GAME"));
    }
    this._status = GameStatus.ACTIVE;
    this.touch();
    return success(undefined);
  }

  /** 게임 종료 */
  public end(): Result<void, DomainError> {
    if (this._status !== GameStatus.ACTIVE) {
      return failure(new DomainError("CANNOT_END_GAME"));
    }
    this._status = GameStatus.ENDED;
    this.touch();
    return success(undefined);
  }

  /** Helper to update timestamp & version */
  private touch() {
    this._timestamps = {
      ...this._timestamps,
      updatedAt: new Date(),
    } as Timestamps;
    this.incrementVersion();
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

  get allocatedPrizePool(): PmpAmount {
    return this._allocatedPrizePool;
  }

  get gameImportanceScore(): number {
    return this._gameImportanceScore;
  }

  /** MoneyWave 상금 풀 배정 */
  public setAllocatedPrizePool(amount: PmpAmount): Result<void, DomainError> {
    if (this._status !== GameStatus.CREATED && this._status !== GameStatus.PENDING) {
      return failure(new DomainError("GAME_ALREADY_STARTED"));
    }
    
    // 금액 유효성 검증 (음수 불가)
    const amountValue = typeof amount === 'number' ? amount : Number(amount);
    if (amountValue < 0) {
      return failure(new DomainError("INVALID_PRIZE_AMOUNT"));
    }
    
    this._allocatedPrizePool = amount;
    this.touch(); // 업데이트 시간 갱신
    
    return success(undefined);
  }

  /** 게임 중요도 점수 설정 */
  public setGameImportanceScore(score: number): Result<void, DomainError> {
    if (score < 1.0 || score > 5.0) {
      return failure(new DomainError("INVALID_IMPORTANCE_SCORE"));
    }
    
    this._gameImportanceScore = score;
    this.touch();
    
    return success(undefined);
  }

  // version getter는 AggregateRoot에서 제공

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
    return this.version;
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
