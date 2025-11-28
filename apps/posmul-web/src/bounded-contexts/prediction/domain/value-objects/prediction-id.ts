/**
 * Prediction Domain - PredictionId Value Object
 *
 * 예측 도메인에 특화된 ID 관리 및 검증
 * 브랜드 타입을 활용한 타입 안전성 보장
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import {
  PredictionGameId as BasePredictionGameId,
  PredictionId as BasePredictionId,
} from "@posmul/auth-economy-sdk";
import { Result } from "@posmul/auth-economy-sdk";
import { ValidationError } from "@posmul/auth-economy-sdk";

/**
 * 예측 ID Value Object
 * 개별 예측의 고유 식별자
 */
export class PredictionId {
  private constructor(private readonly _value: BasePredictionId) {}

  /**
   * 문자열로부터 PredictionId 생성
   */
  public static create(value: string): Result<PredictionId, ValidationError> {
    if (!value || value.trim().length === 0) {
      return {
        success: false,
        error: new ValidationError("Prediction ID cannot be empty", {
          field: "predictionId",
        }),
      };
    }

    // UUID 형식 검증 (간단한 패턴)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(value.trim())) {
      return {
        success: false,
        error: new ValidationError(
          "Prediction ID must be a valid UUID format",
          { field: "predictionId" }
        ),
      };
    }

    return {
      success: true,
      data: new PredictionId(value.trim() as BasePredictionId),
    };
  }

  /**
   * 새로운 PredictionId 생성
   */
  public static generate(): PredictionId {
    const uuid = crypto.randomUUID();
    return new PredictionId(uuid as BasePredictionId);
  }

  /**
   * 기존 브랜드 타입으로부터 생성 (내부 사용)
   */
  public static fromExisting(id: BasePredictionId): PredictionId {
    return new PredictionId(id);
  }

  /**
   * 다른 PredictionId와 동일한지 확인
   */
  public equals(other: PredictionId): boolean {
    return this._value === other._value;
  }

  /**
   * 문자열 표현
   */
  public toString(): string {
    return this._value;
  }

  /**
   * 브랜드 타입 값 반환
   */
  public get value(): BasePredictionId {
    return this._value;
  }

  /**
   * 짧은 형태의 ID (처음 8자리)
   */
  public toShort(): string {
    return this._value.substring(0, 8);
  }

  /**
   * 검증된 형태인지 확인
   */
  public isValid(): boolean {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(this._value);
  }
}

/**
 * 예측 게임 ID Value Object
 * 예측 게임의 고유 식별자
 */
export class PredictionGameId {
  private constructor(private readonly _value: BasePredictionGameId) {}

  /**
   * 문자열로부터 PredictionGameId 생성
   */
  public static create(
    value: string
  ): Result<PredictionGameId, ValidationError> {
    if (!value || value.trim().length === 0) {
      return {
        success: false,
        error: new ValidationError("Prediction Game ID cannot be empty", {
          field: "predictionGameId",
        }),
      };
    }

    // UUID 형식 검증
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(value.trim())) {
      return {
        success: false,
        error: new ValidationError(
          "Prediction Game ID must be a valid UUID format",
          { field: "predictionGameId" }
        ),
      };
    }

    return {
      success: true,
      data: new PredictionGameId(value.trim() as BasePredictionGameId),
    };
  }

  /**
   * 새로운 PredictionGameId 생성
   */
  public static generate(): PredictionGameId {
    const uuid = crypto.randomUUID();
    return new PredictionGameId(uuid as BasePredictionGameId);
  }

  /**
   * 기존 PredictionGameId로부터 생성 (내부 사용)
   */
  public static fromExisting(id: BasePredictionGameId): PredictionGameId {
    return new PredictionGameId(id);
  }

  /**
   * 다른 PredictionGameId와 동일한지 확인
   */
  public equals(other: PredictionGameId): boolean {
    return this._value === other._value;
  }

  /**
   * 문자열 표현
   */
  public toString(): string {
    return this._value;
  }

  /**
   * 브랜드 타입 값 반환
   */
  public get value(): BasePredictionGameId {
    return this._value;
  }

  /**
   * 짧은 형태의 ID (처음 8자리)
   */
  public toShort(): string {
    return this._value.substring(0, 8);
  }

  /**
   * 게임 코드 생성 (사용자 친화적)
   */
  public toGameCode(): string {
    // 예: PG-A1B2C3D4
    return `PG-${this._value.substring(0, 8).toUpperCase()}`;
  }

  /**
   * 검증된 형태인지 확인
   */
  public isValid(): boolean {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(this._value);
  }
}

// Helper functions
export const isValidstring = (value: string): boolean => {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
};

export const isValidPredictionGameId = (value: string): boolean => {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
};
