/**
 * GameStatus Value Object
 *
 * 게임 상태를 나타내는 값 객체로서 문자열 리터럴 대신 타입 안정성을 제공한다.
 * `./prediction-types` 에 정의된 `GameStatus` 유니온 타입을 내부적으로 사용하며,
 * 도메인 계층에서 상태 전환 검증 및 문자열 ↔ 객체 간 변환을 담당한다.
 */

import { Result } from "@posmul/auth-economy-sdk";
import { ValidationError } from "@posmul/auth-economy-sdk";
import type { GameStatus as GameStatusLiteral } from "./prediction-types";

export class GameStatus {
  private constructor(private readonly _value: GameStatusLiteral) {}

  // ----- Static factory -----

  public static create(value: string): Result<GameStatus, ValidationError> {
    const upper = value.toUpperCase();
    if (!GameStatus.VALID_STATUSES.includes(upper as GameStatusLiteral)) {
      return {
        success: false,
        error: new ValidationError(
          `Invalid GameStatus value: ${value}`,
          { field: "gameStatus" }
        ),
      };
    }

    return { success: true, data: new GameStatus(upper as GameStatusLiteral) };
  }

  // ----- Predicates -----

  public isCreated(): boolean {
    return this._value === "CREATED";
  }

  public isActive(): boolean {
    return this._value === "ACTIVE";
  }

  public isEnded(): boolean {
    return this._value === "ENDED";
  }

  public isCompleted(): boolean {
    return this._value === "COMPLETED";
  }

  public isCancelled(): boolean {
    return this._value === "CANCELLED";
  }

  // ----- Conversions -----

  public toString(): GameStatusLiteral {
    return this._value;
  }

  public equals(other: GameStatus): boolean {
    return this._value === other._value;
  }

  // ----- Static constants -----

  public static readonly CREATED = new GameStatus("CREATED");
  public static readonly ACTIVE = new GameStatus("ACTIVE");
  public static readonly ENDED = new GameStatus("ENDED");
  public static readonly COMPLETED = new GameStatus("COMPLETED");
  public static readonly CANCELLED = new GameStatus("CANCELLED");

  // ----- Private helpers -----

  private static readonly VALID_STATUSES: GameStatusLiteral[] = [
    "CREATED",
    "ACTIVE",
    "ENDED",
    "COMPLETED",
    "CANCELLED",
  ];
}

export type { GameStatusLiteral as GameStatusType };
