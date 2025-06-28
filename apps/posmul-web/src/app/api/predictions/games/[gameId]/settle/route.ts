import { SettlePredictionGameUseCase } from "@/bounded-contexts/prediction/application/use-cases/settle-prediction-game.use-case";
import { PredictionEconomicService } from "@/bounded-contexts/prediction/domain/services/prediction-economic.service";
import { SupabasePredictionGameRepository } from "@/bounded-contexts/prediction/infrastructure/repositories/supabase-prediction-game.repository";
import { SupabasePredictionRepository } from "@/bounded-contexts/prediction/infrastructure/repositories/supabase-prediction.repository";
import { IDomainEventPublisher as EconomicEventPublisher } from "@/shared/economy-kernel/events/economic-events";
import { MoneyWaveCalculatorService } from "@/shared/economy-kernel/services/money-wave-calculator.service";
import { InMemoryEventPublisher } from "@/shared/events/event-publisher";
import { PredictionGameId, UserId } from "@/shared/types/branded-types";
import { DomainEvent } from "@/shared/types/common";
import { NextRequest, NextResponse } from "next/server";

// EventPublisher 어댑터 클래스
class EventPublisherAdapter implements EconomicEventPublisher {
  constructor(private readonly publisher: InMemoryEventPublisher) {}

  async publish(event: DomainEvent): Promise<void> {
    const result = await this.publisher.publish(event);
    if (!result.success) {
      throw new Error(`Event publishing failed: ${result.error.message}`);
    }
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    const result = await this.publisher.publishBatch(events);
    if (!result.success) {
      throw new Error(`Batch event publishing failed: ${result.error.message}`);
    }
  }
}

/**
 * POST /api/predictions/games/[gameId]/settle
 * 예측 게임 정산
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

    // Repository 초기화
    const gameRepository = new SupabasePredictionGameRepository();
    const predictionRepository = new SupabasePredictionRepository();

    // 경제 서비스 초기화
    const inMemoryPublisher = new InMemoryEventPublisher();
    const eventPublisher = new EventPublisherAdapter(inMemoryPublisher);
    const economicService = new PredictionEconomicService(eventPublisher);

    // UseCase 초기화
    const moneyWaveCalculator = new MoneyWaveCalculatorService();
    const useCase = new SettlePredictionGameUseCase(
      gameRepository,
      economicService,
      moneyWaveCalculator
    );

    // 정산 요청 생성
    const settlementRequest = {
      gameId: gameId as PredictionGameId,
      correctOptionId: body.correctOptionId,
      adminUserId: body.adminUserId as UserId,
      finalResults: body.finalResults,
    };

    // UseCase 실행
    const result = await useCase.execute(settlementRequest);

    if (!result.success) {
      // 구체적인 에러 처리
      if (result.error.message.includes("not found")) {
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

      if (result.error.message.includes("already settled")) {
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

      if (result.error.message.includes("not ended")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "GAME_NOT_ENDED",
              message: "Game has not ended yet",
            },
          },
          { status: 409 }
        );
      }

      if (result.error.message.includes("unauthorized")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Only authorized admins can settle games",
            },
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SETTLEMENT_FAILED",
            message: result.error.message,
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
    console.error(`POST /api/predictions/games/[gameId]/settle error:`, error);
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
    const gameRepository = new SupabasePredictionGameRepository();
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
      : []; // 정산 가능 여부 판단
    const canSettle =
      game.status.isEnded() &&
      new Date() >= game.configuration.settlementTime &&
      participations.length > 0;

    // 정산 정보 반환
    return NextResponse.json({
      success: true,
      data: {
        gameId,
        gameStatus: game.status,
        canSettle,
        settlementInfo: {
          endTime: game.configuration.endTime,
          settlementTime: game.configuration.settlementTime,
          totalParticipants: participations.length,
          options: game.configuration.options,
          currentTime: new Date(),
        },
        participationSummary: participations.map((p: any) => ({
          userId: p.userId,
          selectedOptionId: p.selectedOptionId,
          stakeAmount: p.stakeAmount,
          confidence: p.confidence,
        })),
      },
      metadata: {
        timestamp: new Date(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error(`GET /api/predictions/games/[gameId]/settle error:`, error);
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
