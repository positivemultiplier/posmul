/**
 * Prediction Domain Value Objects
 */
import { Result } from "@posmul/auth-economy-sdk";
import { ValidationError } from "@posmul/auth-economy-sdk";
import {
  PmcAmount,
  PmpAmount,
  createPmcAmount,
  createPmpAmount,
} from "@posmul/auth-economy-sdk";

import { GameStatus as BaseGameStatus } from "./game-status";

/**
 * 확신도 Value Object
 */
export class ConfidenceLevel {
  private constructor(private readonly _value: number) {}

  public static create(
    value: number
  ): Result<ConfidenceLevel, ValidationError> {
    if (value < 0.0 || value > 1.0) {
      return {
        success: false,
        error: new ValidationError(
          `Confidence level must be between 0.0 and 1.0, got: ${value}`,
          { field: "confidenceLevel", value }
        ),
      };
    }

    if (isNaN(value) || !isFinite(value)) {
      return {
        success: false,
        error: new ValidationError(
          "Confidence level must be a valid finite number",
          { field: "confidenceLevel", value }
        ),
      };
    }

    return { success: true, data: new ConfidenceLevel(value) };
  }

  public isHigh(): boolean {
    return this._value >= 0.8;
  }

  public isMedium(): boolean {
    return this._value >= 0.4 && this._value < 0.8;
  }

  public isLow(): boolean {
    return this._value < 0.4;
  }

  public getInformationQuality(): number {
    return 1 / (1 + Math.exp(-10 * (this._value - 0.5)));
  }

  public getStakeMultiplier(): number {
    return Math.pow(this._value, 2);
  }

  public get value(): number {
    return this._value;
  }

  public toString(): string {
    return `${(this._value * 100).toFixed(1)}%`;
  }

  public equals(other: ConfidenceLevel): boolean {
    return Math.abs(this._value - other._value) < 0.001;
  }
}

/**
 * 스테이크 금액 Value Object
 */
export class StakeAmount {
  private constructor(
    private readonly _pmpAmount: PmpAmount,
    private readonly _confidenceLevel: ConfidenceLevel
  ) {}

  public static create(
    pmpAmount: number,
    confidenceLevel: ConfidenceLevel
  ): Result<StakeAmount, ValidationError> {
    if (pmpAmount < 1) {
      return {
        success: false,
        error: new ValidationError(
          "Stake amount must be at least 1 PmpAmount",
          { field: "stakeAmount", value: pmpAmount }
        ),
      };
    }

    if (pmpAmount > 10000) {
      return {
        success: false,
        error: new ValidationError(
          "Stake amount cannot exceed 10,000 PmpAmount",
          { field: "stakeAmount", value: pmpAmount }
        ),
      };
    }

    const pmpResult = createPmpAmount(pmpAmount);
    return { success: true, data: new StakeAmount(pmpResult, confidenceLevel) };
  }

  public getAdjustedStake(): PmpAmount {
    const baseAmount = this._pmpAmount as number;
    const multiplier = this._confidenceLevel.getStakeMultiplier();
    return createPmpAmount(Math.floor(baseAmount * multiplier));
  }

  public calculateExpectedReward(
    totalPool: PmpAmount,
    winnerCount: number
  ): PmcAmount {
    if (winnerCount === 0) return createPmcAmount(0);

    const poolAmount = totalPool as number;
    const baseReward = poolAmount / winnerCount;
    const confidenceBonus = this._confidenceLevel.value * 0.2;
    const finalReward = baseReward * (1 + confidenceBonus);

    return createPmcAmount(Math.floor(finalReward));
  }

  public getRiskLevel(): "LOW" | "MEDIUM" | "HIGH" {
    const amount = this._pmpAmount as number;
    if (amount < 100) return "LOW";
    if (amount < 1000) return "MEDIUM";
    return "HIGH";
  }

  public get pmpAmount(): PmpAmount {
    return this._pmpAmount;
  }

  public get confidenceLevel(): ConfidenceLevel {
    return this._confidenceLevel;
  }

  public toString(): string {
    return `${this._pmpAmount} PmpAmount (${this._confidenceLevel.toString()})`;
  }

  public equals(other: StakeAmount): boolean {
    return (
      (this._pmpAmount as number) === (other._pmpAmount as number) &&
      this._confidenceLevel.equals(other._confidenceLevel)
    );
  }
}

/**
 * 예측 옵션 Value Object
 */
export class PredictionOption {
  private constructor(
    private readonly _id: string,
    private readonly _label: string,
    private readonly _description?: string
  ) {}

  public static create(
    id: string,
    label: string,
    description?: string
  ): Result<PredictionOption, ValidationError> {
    if (!id || id.trim().length === 0) {
      return {
        success: false,
        error: new ValidationError("Prediction option ID cannot be empty", {
          field: "optionId",
          value: id,
        }),
      };
    }

    if (!label || label.trim().length === 0) {
      return {
        success: false,
        error: new ValidationError("Prediction option label cannot be empty", {
          field: "optionLabel",
          value: label,
        }),
      };
    }

    if (label.length > 100) {
      return {
        success: false,
        error: new ValidationError(
          "Prediction option label cannot exceed 100 characters",
          { field: "optionLabel", value: label }
        ),
      };
    }

    if (description && description.length > 500) {
      return {
        success: false,
        error: new ValidationError(
          "Prediction option description cannot exceed 500 characters",
          { field: "optionDescription", value: description }
        ),
      };
    }

    return {
      success: true,
      data: new PredictionOption(id.trim(), label.trim(), description?.trim()),
    };
  }

  public static createBinaryOptions(): Result<
    PredictionOption[],
    ValidationError
  > {
    const yesResult = PredictionOption.create("yes", "Yes", "Positive outcome");
    const noResult = PredictionOption.create("no", "No", "Negative outcome");

    if (!yesResult.success) {
      return yesResult as Result<PredictionOption[], ValidationError>;
    }
    if (!noResult.success) {
      return noResult as Result<PredictionOption[], ValidationError>;
    }

    return { success: true, data: [yesResult.data, noResult.data] };
  }

  public static createWinDrawLoseOptions(): Result<
    PredictionOption[],
    ValidationError
  > {
    const winResult = PredictionOption.create("win", "Win", "Victory outcome");
    const drawResult = PredictionOption.create("draw", "Draw", "Tie outcome");
    const loseResult = PredictionOption.create(
      "lose",
      "Lose",
      "Defeat outcome"
    );

    if (!winResult.success) {
      return winResult as Result<PredictionOption[], ValidationError>;
    }
    if (!drawResult.success) {
      return drawResult as Result<PredictionOption[], ValidationError>;
    }
    if (!loseResult.success) {
      return loseResult as Result<PredictionOption[], ValidationError>;
    }

    return {
      success: true,
      data: [winResult.data, drawResult.data, loseResult.data],
    };
  }

  public get id(): string {
    return this._id;
  }

  public get label(): string {
    return this._label;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public toString(): string {
    return `${this._label} (${this._id})`;
  }

  public equals(other: PredictionOption): boolean {
    return this._id === other._id;
  }
}

// Helper type guards
export const isValidGameStatus = (value: string): boolean => {
  const result = BaseGameStatus.create(value);
  return result.success;
};

// TODO: BasePredictionResult을 SDK로 마이그레이션한 후 복원 필요
export const isValidPredictionResult = (value: string): boolean => {
  // 임시로 기본적인 결과값만 검증
  return ["win", "lose", "draw", "cancelled"].includes(value);
};
