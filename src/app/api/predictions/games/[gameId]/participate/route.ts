import { ParticipatePredictionUseCase } from "@/bounded-contexts/prediction/application/use-cases/participate-prediction.use-case";
import { PredictionEconomicService } from "@/bounded-contexts/prediction/domain/services/prediction-economic.service";
import { SupabasePredictionGameRepository } from "@/bounded-contexts/prediction/infrastructure/repositories/supabase-prediction-game.repository";
import { InMemoryEventPublisher } from "@/shared/events/event-publisher";
import { PredictionGameId, UserId } from "@/shared/types/branded-types";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/predictions/games/[gameId]/participate
 * 예측 게임 참여
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

    // 기본 검증
    if (
      !body.userId ||
      !body.selectedOptionId ||
      !body.stakeAmount ||
      !body.confidence
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message:
              "userId, selectedOptionId, stakeAmount, and confidence are required",
          },
        },
        { status: 400 }
      );
    }

    // Repository 및 서비스 초기화
    const gameRepository = new SupabasePredictionGameRepository();
    const eventPublisher = new InMemoryEventPublisher();
    // EventPublisher 인터페이스 어댑터 생성
    const eventPublisherAdapter = {
      publish: async (event: any) => {
        const result = await eventPublisher.publish(event);
        if (!result.success) {
          throw new Error(result.error.message);
        }
      },
      publishBatch: async (events: any[]) => {
        const result = await eventPublisher.publishBatch(events);
        if (!result.success) {
          throw new Error(result.error.message);
        }
      },
    };
    const economicService = new PredictionEconomicService(
      eventPublisherAdapter
    );

    // UseCase 초기화
    const useCase = new ParticipatePredictionUseCase(
      gameRepository,
      economicService
    );

    // 요청 DTO 생성
    const participationRequest = {
      userId: body.userId as UserId,
      gameId: gameId as PredictionGameId,
      selectedOptionId: body.selectedOptionId,
      stakeAmount: body.stakeAmount,
      confidence: body.confidence,
      reasoning: body.reasoning,
    };

    // UseCase 실행
    const result = await useCase.execute(participationRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PARTICIPATION_FAILED",
            message: result.error.message,
          },
        },
        { status: 400 }
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
      { status: 201 }
    );
  } catch (error) {
    console.error(
      `POST /api/predictions/games/[gameId]/participate error:`,
      error
    );
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
 * GET /api/predictions/games/[gameId]/participate
 * 참여 가능 여부 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!gameId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAMETERS",
            message: "Game ID and User ID are required",
          },
        },
        { status: 400 }
      );
    }

    // Repository 초기화
    const gameRepository = new SupabasePredictionGameRepository();

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

    // 기본 정보 반환
    return NextResponse.json({
      success: true,
      data: {
        gameId,
        gameStatus: game.status.toString(),
        canParticipate: game.status.isActive(),
        requirements: {
          minimumStake: game.configuration.minimumStake,
          maximumStake: game.configuration.maximumStake,
          maxParticipants: game.configuration.maxParticipants,
        },
      },
      metadata: {
        timestamp: new Date(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error(
      `GET /api/predictions/games/[gameId]/participate error:`,
      error
    );
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
