/**
 * Prediction Entity
 *
 * 개별 예측을 나타내는 도메인 엔티티입니다.
 * PredictionGame Aggregate와 일관성을 유지하며 재사용 가능한 구조로 설계합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import {
  PredictionGameId,
  PredictionId,
  Result,
  UserId,
  isFailure,
} from "@posmul/auth-economy-sdk";
import {
  AccuracyScore,
  DomainError,
  ValidationError,
  failure,
  success,
} from "@posmul/auth-economy-sdk";
import { PmpAmount } from "@posmul/auth-economy-sdk/economy";

import {
  PredictionResult as PredictionResultType,
  Timestamps,
  createPredictionId,
} from "../types/common";

/**
 * 예측 생성을 위한 입력 데이터 인터페이스
 */
export interface CreatePredictionInput {
  readonly userId: UserId;
  readonly gameId: PredictionGameId;
  readonly selectedOptionId: string;
  readonly stake: PmpAmount;
  readonly confidence: number; // 0-1 범위
  readonly reasoning?: string;
}

/**
 * 예측 결과 설정을 위한 입력 데이터 인터페이스
 */
export interface SetPredictionResultInput {
  readonly result: PredictionResultType;
  readonly accuracyScore: AccuracyScore;
  readonly reward: PmpAmount;
}

/**
 * 예측 성능 지표 인터페이스
 */
export interface PredictionPerformance {
  readonly predictionId: PredictionId;
  readonly userId: UserId;
  readonly gameId: PredictionGameId;
  readonly stake: PmpAmount;
  readonly confidence: number;
  readonly result?: PredictionResultType;
  readonly accuracyScore?: AccuracyScore;
  readonly reward?: PmpAmount;
  readonly riskAdjustedReturn?: number; // 위험 조정 수익률
  readonly informationValue?: number; // 정보 가치
}

/**
 * Prediction Entity
 */
export class Prediction {
  private constructor(
    private readonly _id: PredictionId,
    private readonly _userId: UserId,
    private readonly _gameId: PredictionGameId,
    private readonly _selectedOptionId: string,
    private readonly _stake: PmpAmount,
    private readonly _confidence: number, // 0-1 범위
    private readonly _reasoning?: string,
    private _result?: PredictionResultType,
    private _accuracyScore?: AccuracyScore,
    private _reward?: PmpAmount,
    private readonly _timestamps: Timestamps = {
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ) {
    this.validateInvariants();
  }

  /**
   * 예측 생성 팩토리 메서드
   */
  public static create(
    input: CreatePredictionInput
  ): Result<Prediction, ValidationError | DomainError> {
    // 유효성 검증
    const validationResult = Prediction.validateInput(input);
    if (isFailure(validationResult)) {
      return failure(
        new DomainError(validationResult.error?.message || "Unknown error")
      );
    }

    const predictionId = createPredictionId(crypto.randomUUID());

    const prediction = new Prediction(
      predictionId,
      input.userId,
      input.gameId,
      input.selectedOptionId,
      input.stake,
      input.confidence,
      input.reasoning
    );

    return success(prediction);
  }

  /**
   * 기존 데이터에서 Prediction 복원 (Repository용)
   */
  public static reconstitute(
    id: PredictionId,
    userId: UserId,
    gameId: PredictionGameId,
    selectedOptionId: string,
    stake: PmpAmount,
    confidence: number,
    reasoning: string | undefined,
    result: PredictionResultType | undefined,
    accuracyScore: AccuracyScore | undefined,
    reward: PmpAmount | undefined,
    timestamps: Timestamps
  ): Prediction {
    return new Prediction(
      id,
      userId,
      gameId,
      selectedOptionId,
      stake,
      confidence,
      reasoning,
      result,
      accuracyScore,
      reward,
      timestamps
    );
  }

  /**
   * 예측 결과 설정
   */
  public setResult(input: SetPredictionResultInput): Result<void, DomainError> {
    if (this._result !== undefined) {
      return failure(new DomainError("RESULT_ALREADY_SET"));
    }

    // 정확도 점수 유효성 검증
    if (input.accuracyScore < 0 || input.accuracyScore > 1) {
      return failure(new DomainError("INVALID_ACCURACY_SCORE"));
    }

    // 보상 유효성 검증 (음수 불가)
    if (input.reward < 0) {
      return failure(new DomainError("INVALID_REWARD"));
    }

    this._result = input.result;
    this._accuracyScore = input.accuracyScore;
    this._reward = input.reward;

    return success(undefined);
  }

  /**
   * 예측 성능 지표 계산
   */
  public getPerformanceMetrics(): PredictionPerformance {
    const riskAdjustedReturn = this.calculateRiskAdjustedReturn();
    const informationValue = this.calculateInformationValue();

    return {
      predictionId: this._id,
      userId: this._userId,
      gameId: this._gameId,
      stake: this._stake,
      confidence: this._confidence,
      result: this._result,
      accuracyScore: this._accuracyScore,
      reward: this._reward,
      riskAdjustedReturn,
      informationValue,
    };
  }

  /**
   * 위험 조정 수익률 계산
   * (보상 - 투입) / 투입 / 위험도
   */
  private calculateRiskAdjustedReturn(): number | undefined {
    if (!this._reward || !this._accuracyScore) {
      return undefined;
    }

    const rawReturn = (this._reward - this._stake) / this._stake;
    const riskFactor = 1 - this._confidence; // 낮은 확신도 = 높은 위험도

    return riskFactor > 0 ? rawReturn / riskFactor : rawReturn;
  }

  /**
   * 정보 가치 계산
   * 확신도 × 정확도 × 스테이크 크기
   */
  private calculateInformationValue(): number | undefined {
    if (!this._accuracyScore) {
      return undefined;
    }

    return this._confidence * this._accuracyScore * this._stake;
  }

  /**
   * 예측이 정답인지 확인
   */
  public isCorrect(): boolean | undefined {
    if (!this._result) {
      return undefined;
    }

    return this._result === PredictionResultType.CORRECT;
  }

  /**
   * 예측이 완료되었는지 확인
   */
  public isSettled(): boolean {
    return this._result !== undefined;
  }

  /**
   * 높은 확신도 예측인지 확인 (0.7 이상)
   */
  public isHighConfidence(): boolean {
    return this._confidence >= 0.7;
  }

  /**
   * 대형 스테이크인지 확인 (임계값 비교)
   */
  public isLargeStake(threshold: PmpAmount): boolean {
    return this._stake >= threshold;
  }

  /**
   * 입력 데이터 유효성 검증
   */
  private static validateInput(
    input: CreatePredictionInput
  ): Result<void, ValidationError | DomainError> {
    if (!input.selectedOptionId || input.selectedOptionId.trim().length === 0) {
      return failure(
        new ValidationError("Selected option ID is required", {
          field: "selectedOptionId",
        })
      );
    }

    if (input.confidence < 0 || input.confidence > 1) {
      return failure(
        new ValidationError("Confidence must be between 0 and 1", {
          field: "confidence",
        })
      );
    }

    if (Number.isNaN(input.stake) || input.stake <= 0) {
      return failure(
        new ValidationError("Stake must be positive", { field: "stake" })
      );
    }

    if (input.reasoning && input.reasoning.length > 1000) {
      return failure(
        new ValidationError("Reasoning cannot exceed 1000 characters", {
          field: "reasoning",
        })
      );
    }

    return success(undefined);
  }

  /**
   * 불변 조건 검증
   */
  private validateInvariants(): void {
    if (this._confidence < 0 || this._confidence > 1) {
      throw new ValidationError("Confidence must be between 0 and 1", {
        field: "confidence",
      });
    }

    if (this._stake <= 0) {
      throw new ValidationError("Stake must be positive", { field: "stake" });
    }

    if (!this._selectedOptionId || this._selectedOptionId.trim().length === 0) {
      throw new ValidationError("Selected option ID is required", {
        field: "selectedOptionId",
      });
    }

    // 결과가 설정된 경우 정확도와 보상도 설정되어야 함
    if (this._result !== undefined) {
      if (this._accuracyScore === undefined || this._reward === undefined) {
        throw new DomainError("INCOMPLETE_RESULT");
      }
    }
  }

  /**
   * 예측 비교 (정렬용)
   */
  public compareTo(other: Prediction): number {
    // 먼저 확신도로 정렬 (높은 순)
    const confidenceDiff = other._confidence - this._confidence;
    if (Math.abs(confidenceDiff) > 0.001) {
      return confidenceDiff;
    }

    // 확신도가 같으면 스테이크로 정렬 (높은 순)
    const stakeDiff = other._stake - this._stake;
    if (Math.abs(stakeDiff) > 0.001) {
      return stakeDiff;
    }

    // 마지막으로 생성 시간으로 정렬 (먼저 생성된 순)
    return (
      this._timestamps.createdAt.getTime() -
      other._timestamps.createdAt.getTime()
    );
  }

  /**
   * 예측 정보를 요약 문자열로 변환
   */
  public toString(): string {
    const status = this._result ? `[${this._result}]` : "[PENDING]";
    const confidencePercent = Math.round(this._confidence * 100);

    return (
      `Prediction ${this._id} ${status}: Option ${this._selectedOptionId}, ` +
      `Stake ${this._stake} PmpAmount, Confidence ${confidencePercent}%`
    );
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
  public get stake(): PmpAmount {
    return this._stake;
  }
  public get confidence(): number {
    return this._confidence;
  }
  public get reasoning(): string | undefined {
    return this._reasoning;
  }
  public get result(): PredictionResultType | undefined {
    return this._result;
  }
  public get accuracyScore(): AccuracyScore | undefined {
    return this._accuracyScore;
  }
  public get reward(): PmpAmount | undefined {
    return this._reward;
  }
  public get timestamps(): Timestamps {
    return this._timestamps;
  }
}
