/**
 * Settle Prediction Game Use Case
 *
 * 예측 게임 정산 비즈니스 로직을 처리합니다.
 * - 정답 확인 및 게임 종료
 * - DB 함수를 통한 정산 처리 (PMC 보상 지급, PMP 소각)
 * - Money Wave 분배 연동
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

/**
 * 예측 게임 정산 완료 이벤트
 */
class PredictionGameSettledEvent extends BaseDomainEvent {
  constructor(
    gameId: PredictionGameId,
    correctOptionId: string,
    totalRewardDistributed: number,
    winnersCount: number,
    losersCount: number
  ) {
    super("PREDICTION_GAME_SETTLED", gameId, {
      correctOptionId,
      totalRewardDistributed,
      winnersCount,
      losersCount,
    });
  }
}

/**
 * 예측 게임 정산 요청 DTO
 */
export interface SettlePredictionGameRequest {
  readonly gameId: PredictionGameId;
  readonly correctOptionId: string;
  readonly adminUserId: UserId; // 정산을 실행하는 관리자
}

/**
 * 예측 게임 정산 응답 DTO
 */
export interface SettlePredictionGameResponse {
  readonly success: boolean;
  readonly gameId: string;
  readonly correctOptionId: string;
  readonly totalRewardDistributed: number;
  readonly winnersCount: number;
  readonly losersCount: number;
  readonly settledAt: Date;
  readonly error?: UseCaseError;
}

/**
 * 예측 게임 정산 유스케이스
 *
 * DB의 settle_prediction_game() 함수를 통해 정산 처리:
 * 1. 게임 상태를 SETTLED로 변경
 * 2. 승자에게 PMC 보상 지급 (economy + user_profiles 동기화)
 * 3. 패자의 PMP 소각 기록
 * 4. 거래 기록 생성
 */
export class SettlePredictionGameUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository
  ) {}

  /**
   * 예측 게임 정산 실행
   */
  async execute(
    request: SettlePredictionGameRequest
  ): Promise<Result<SettlePredictionGameResponse, UseCaseError>> {
    try {
      console.log("[SettleGame] Step 1: 게임 조회");
      
      // 1. 게임 조회 및 검증
      const gameResult = await this.predictionGameRepository.findById(
        request.gameId
      );
      if (isFailure(gameResult)) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }

      const predictionGame = gameResult.data;
      if (!predictionGame) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }

      console.log("[SettleGame] Step 2: 게임 상태 검증 - 현재:", predictionGame.getStatus());

      // 2. 게임 상태 검증 - ACTIVE 게임만 정산 가능
      const status = predictionGame.getStatus();
      if (status !== "ACTIVE") {
        return {
          success: false,
          error: new UseCaseError(`Game cannot be settled. Current status: ${status}`),
        };
      }

      // 3. 정답 옵션 검증
      const validOption = predictionGame.options.find(
        (opt) => opt.id === request.correctOptionId
      );
      if (!validOption) {
        return {
          success: false,
          error: new UseCaseError("Invalid correct option ID"),
        };
      }

      console.log("[SettleGame] Step 3: DB 함수로 정산 실행");

      // 4. Repository의 settleGame 메서드 호출 (DB 함수 실행)
      const settlementResult = await this.predictionGameRepository.settleGame(
        request.gameId,
        request.correctOptionId
      );

      if (isFailure(settlementResult)) {
        console.error("[SettleGame] Settlement failed:", settlementResult.error);
        return {
          success: false,
          error: new UseCaseError("Settlement failed: " + settlementResult.error?.message),
        };
      }

      const settlement = settlementResult.data;
      console.log("[SettleGame] Step 4: 정산 완료", settlement);

      // 5. 정산 완료 이벤트 발행
      await publishEvent(
        new PredictionGameSettledEvent(
          request.gameId,
          request.correctOptionId,
          settlement.totalRewardDistributed,
          settlement.winnersCount,
          settlement.losersCount
        )
      );

      // 6. 성공 응답 반환
      return {
        success: true,
        data: {
          success: true,
          gameId: settlement.gameId,
          correctOptionId: settlement.correctOptionId,
          totalRewardDistributed: settlement.totalRewardDistributed,
          winnersCount: settlement.winnersCount,
          losersCount: settlement.losersCount,
          settledAt: settlement.settledAt,
        },
      };
    } catch (error) {
      console.error("[SettleGame] Unexpected error:", error);
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in SettlePredictionGameUseCase",
          { originalError: (error as any)?.message || "Unknown error" }
        ),
      };
    }
  }
}
