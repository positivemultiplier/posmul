/**
 * Prediction Domain - GameStatus Value Object
 *
 * 예측 게임의 상태 관리 및 상태 전환 규칙
 * task_list.md 요구사항: Created, Active, Ended, Settled
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import {
  Result,
  ValidationError,
} from "../../../../shared/types/economic-system";

/**
 * 예측 게임 상태 열거형
 */
export enum GameStatusEnum {
  CREATED = "CREATED", // 게임 생성됨 (아직 시작 안됨)
  ACTIVE = "ACTIVE", // 게임 활성화 (예측 참여 가능)
  ENDED = "ENDED", // 게임 종료 (예측 참여 불가, 결과 대기)
  SETTLED = "SETTLED", // 게임 정산 완료 (보상 지급 완료)
}

/**
 * 게임 상태 Value Object
 * 상태 전환 규칙과 비즈니스 로직을 캡슐화
 */
export class GameStatus {
  private constructor(private readonly _status: GameStatusEnum) {}

  // Static factory methods for each status
  public static readonly CREATED = new GameStatus(GameStatusEnum.CREATED);
  public static readonly ACTIVE = new GameStatus(GameStatusEnum.ACTIVE);
  public static readonly ENDED = new GameStatus(GameStatusEnum.ENDED);
  public static readonly SETTLED = new GameStatus(GameStatusEnum.SETTLED);

  /**
   * 문자열로부터 GameStatus 생성
   */
  public static create(status: string): Result<GameStatus, ValidationError> {
    const upperStatus = status.toUpperCase();

    if (
      !Object.values(GameStatusEnum).includes(upperStatus as GameStatusEnum)
    ) {
      return {
        success: false,
        error: new ValidationError(
          `Invalid game status: ${status}. Must be one of: ${Object.values(
            GameStatusEnum
          ).join(", ")}`,
          "gameStatus"
        ),
      };
    }

    return {
      success: true,
      data: new GameStatus(upperStatus as GameStatusEnum),
    };
  }

  /**
   * 게임 상태 전환 가능성 확인
   *
   * 허용되는 상태 전환:
   * CREATED → ACTIVE
   * ACTIVE → ENDED
   * ENDED → SETTLED
   */
  public canTransitionTo(nextStatus: GameStatus): boolean {
    const current = this._status;
    const next = nextStatus._status;

    const validTransitions: Record<GameStatusEnum, GameStatusEnum[]> = {
      [GameStatusEnum.CREATED]: [GameStatusEnum.ACTIVE],
      [GameStatusEnum.ACTIVE]: [GameStatusEnum.ENDED],
      [GameStatusEnum.ENDED]: [GameStatusEnum.SETTLED],
      [GameStatusEnum.SETTLED]: [], // 최종 상태, 더 이상 전환 불가
    };

    return validTransitions[current]?.includes(next) ?? false;
  }

  /**
   * 다음 가능한 상태들 반환
   */
  public getNextValidStatuses(): GameStatus[] {
    switch (this._status) {
      case GameStatusEnum.CREATED:
        return [GameStatus.ACTIVE];
      case GameStatusEnum.ACTIVE:
        return [GameStatus.ENDED];
      case GameStatusEnum.ENDED:
        return [GameStatus.SETTLED];
      case GameStatusEnum.SETTLED:
        return []; // 최종 상태
      default:
        return [];
    }
  }

  /**
   * 예측 참여 가능한 상태인지 확인
   */
  public isPredictionAllowed(): boolean {
    return this._status === GameStatusEnum.ACTIVE;
  }

  /**
   * 게임이 진행 중인지 확인 (CREATED 또는 ACTIVE)
   */
  public isInProgress(): boolean {
    return (
      this._status === GameStatusEnum.CREATED ||
      this._status === GameStatusEnum.ACTIVE
    );
  }

  /**
   * 게임이 완료되었는지 확인 (ENDED 또는 SETTLED)
   */
  public isCompleted(): boolean {
    return (
      this._status === GameStatusEnum.ENDED ||
      this._status === GameStatusEnum.SETTLED
    );
  }

  /**
   * 게임이 생성 상태인지 확인
   */
  public isCreated(): boolean {
    return this._status === GameStatusEnum.CREATED;
  }

  /**
   * 게임이 활성 상태인지 확인
   */
  public isActive(): boolean {
    return this._status === GameStatusEnum.ACTIVE;
  }

  /**
   * 게임이 종료 상태인지 확인
   */
  public isEnded(): boolean {
    return this._status === GameStatusEnum.ENDED;
  }

  /**
   * 게임이 정산 완료 상태인지 확인
   */
  public isSettled(): boolean {
    return this._status === GameStatusEnum.SETTLED;
  }

  /**
   * 결과 평가가 가능한 상태인지 확인
   */
  public canEvaluateResults(): boolean {
    return this._status === GameStatusEnum.ENDED;
  }

  /**
   * 보상 지급이 가능한 상태인지 확인
   */
  public canDistributeRewards(): boolean {
    return this._status === GameStatusEnum.ENDED;
  }

  /**
   * 게임 상태에 따른 사용자 친화적 메시지
   */
  public getStatusMessage(): string {
    switch (this._status) {
      case GameStatusEnum.CREATED:
        return "게임이 생성되었습니다. 곧 시작됩니다.";
      case GameStatusEnum.ACTIVE:
        return "게임이 진행 중입니다. 예측에 참여하세요!";
      case GameStatusEnum.ENDED:
        return "게임이 종료되었습니다. 결과를 확인하고 있습니다.";
      case GameStatusEnum.SETTLED:
        return "게임이 완료되었습니다. 보상이 지급되었습니다.";
      default:
        return "알 수 없는 상태입니다.";
    }
  }

  /**
   * 상태 변경 시 필요한 액션 반환
   */
  public getRequiredActionsForNextStatus(): string[] {
    switch (this._status) {
      case GameStatusEnum.CREATED:
        return ["게임 시작 시간 설정", "참여자 모집"];
      case GameStatusEnum.ACTIVE:
        return ["예측 마감 시간 확인", "게임 종료 조건 체크"];
      case GameStatusEnum.ENDED:
        return ["결과 평가", "정확도 계산", "보상 계산"];
      case GameStatusEnum.SETTLED:
        return []; // 완료된 상태
      default:
        return [];
    }
  }

  /**
   * 상태 지속 시간 제한 (분 단위)
   */
  public getMaxDurationInMinutes(): number | null {
    switch (this._status) {
      case GameStatusEnum.CREATED:
        return 60; // 1시간 내에 시작되어야 함
      case GameStatusEnum.ACTIVE:
        return 24 * 60; // 최대 24시간 진행
      case GameStatusEnum.ENDED:
        return 30; // 30분 내에 정산되어야 함
      case GameStatusEnum.SETTLED:
        return null; // 영구적
      default:
        return null;
    }
  }

  /**
   * 상태 값 반환
   */
  public get status(): GameStatusEnum {
    return this._status;
  }

  /**
   * 문자열 변환
   */
  public toString(): string {
    return this._status;
  }

  /**
   * 다른 GameStatus와 동일한지 확인
   */
  public equals(other: GameStatus): boolean {
    return this._status === other._status;
  }

  /**
   * 상태의 순서 비교 (진행 단계)
   */
  public getOrder(): number {
    switch (this._status) {
      case GameStatusEnum.CREATED:
        return 1;
      case GameStatusEnum.ACTIVE:
        return 2;
      case GameStatusEnum.ENDED:
        return 3;
      case GameStatusEnum.SETTLED:
        return 4;
      default:
        return 0;
    }
  }

  /**
   * 다른 상태보다 이전 단계인지 확인
   */
  public isBefore(other: GameStatus): boolean {
    return this.getOrder() < other.getOrder();
  }

  /**
   * 다른 상태보다 이후 단계인지 확인
   */
  public isAfter(other: GameStatus): boolean {
    return this.getOrder() > other.getOrder();
  }
}

// Helper functions
export const isValidGameStatus = (value: string): value is GameStatusEnum => {
  return Object.values(GameStatusEnum).includes(
    value.toUpperCase() as GameStatusEnum
  );
};

export const getAllGameStatuses = (): GameStatus[] => {
  return [
    GameStatus.CREATED,
    GameStatus.ACTIVE,
    GameStatus.ENDED,
    GameStatus.SETTLED,
  ];
};

export const getGameStatusFlow = (): {
  from: GameStatus;
  to: GameStatus[];
}[] => {
  return [
    { from: GameStatus.CREATED, to: [GameStatus.ACTIVE] },
    { from: GameStatus.ACTIVE, to: [GameStatus.ENDED] },
    { from: GameStatus.ENDED, to: [GameStatus.SETTLED] },
    { from: GameStatus.SETTLED, to: [] },
  ];
};
