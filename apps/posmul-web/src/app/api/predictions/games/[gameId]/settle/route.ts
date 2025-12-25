import {
  PredictionGameId,
  UserId,
  isFailure,
} from "@posmul/auth-economy-sdk";

import { NextRequest, NextResponse } from "next/server";

import { getSettlePredictionGameUseCase } from "../../../../../../bounded-contexts/prediction/di-container";
import { MCPPredictionGameRepository } from "../../../../../../bounded-contexts/prediction/infrastructure/repositories/mcp-prediction-game.repository";
import { SupabasePredictionRepository } from "../../../../../../bounded-contexts/prediction/infrastructure/repositories/supabase-prediction.repository";

/**
 * POST /api/predictions/games/[gameId]/settle
 * 예측 게임 정산 (DB 함수 호출)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();

    if (!gameId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_GAME_ID",
            message: "Game ID is required",
          },
        },
        { status: 400 }
      );
    }

    // 필수 필드 검증
    if (!body.correctOptionId || !body.adminUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "correctOptionId and adminUserId are required",
          },
        },
        { status: 400 }
      );
    }

    // DI Container에서 UseCase 가져오기
    const useCase = getSettlePredictionGameUseCase();

    // 정산 요청 생성
    const settlementRequest = {
      gameId: gameId as PredictionGameId,
      correctOptionId: body.correctOptionId,
      adminUserId: body.adminUserId as UserId,
    };

    // UseCase 실행
    const result = await useCase.execute(settlementRequest);

    if (!result.success) {
      // 구체적인 에러 처리
      if (isFailure(result) && result.error.message.includes("not found")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "GAME_NOT_FOUND",
              message: "Prediction game not found",
            },
          },
          { status: 404 }
        );
      }

      if (
        isFailure(result) &&
        result.error.message.includes("already settled")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALREADY_SETTLED",
              message: "Game has already been settled",
            },
          },
          { status: 409 }
        );
      }

      if (isFailure(result) && result.error.message.includes("cannot be settled")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_STATUS",
              message: result.error.message,
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SETTLEMENT_FAILED",
            message: isFailure(result) ? result.error.message : "Unknown error",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        metadata: {
          timestamp: new Date(),
          version: "1.0.0",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    void error;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/predictions/games/[gameId]/settle
 * 정산 가능 여부 및 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    if (!gameId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_GAME_ID",
            message: "Game ID is required",
          },
        },
        { status: 400 }
      );
    }

    // Repository 초기화
    const gameRepository = new MCPPredictionGameRepository();
    const predictionRepository = new SupabasePredictionRepository();

    // 게임 정보 조회
    const gameResult = await gameRepository.findById(
      gameId as PredictionGameId
    );
    if (!gameResult.success || !gameResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GAME_NOT_FOUND",
            message: "Prediction game not found",
          },
        },
        { status: 404 }
      );
    }

    const game = gameResult.data;

    // 게임 참여자 조회
    const participationsResult = await predictionRepository.findByGame(
      gameId as PredictionGameId
    );
    const participations = participationsResult.success
      ? participationsResult.data.items || []
      : [];

    // 정산 가능 여부 판단 (ACTIVE 상태만 정산 가능)
    const gameStatus = game.getStatus();
    const canSettle =
      gameStatus === "ACTIVE" &&
      participations.length > 0;

    // 정산 정보 반환
    return NextResponse.json({
      success: true,
      data: {
        gameId,
        gameStatus,
        canSettle,
        settlementInfo: {
          endTime: game.endTime,
          settlementTime: game.settlementTime,
          totalParticipants: participations.length,
          options: game.options,
          currentTime: new Date(),
        },
        participationSummary: participations.map((p: any) => ({
          userId: p.userId,
          selectedOptionId: p.selectedOptionId,
          stakeAmount: p.stake,
          confidence: p.confidence,
        })),
      },
      metadata: {
        timestamp: new Date(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
