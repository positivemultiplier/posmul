import { UserId, isFailure } from "../../../../shared/legacy-compatibility";
import { NextRequest, NextResponse } from "next/server";
import { CreatePredictionGameUseCase } from "../../../../bounded-contexts/prediction/application/use-cases/create-prediction-game.use-case";
import { GetPredictionGamesUseCase } from "../../../../bounded-contexts/prediction/application/use-cases/get-prediction-games.use-case";
import { SupabasePredictionGameRepository } from "../../../../bounded-contexts/prediction/infrastructure/repositories/supabase-prediction-game.repository";

/**
 * GET /api/predictions/games
 * 예측 게임 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ACTIVE";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Repository 및 UseCase 초기화
    const repository = new SupabasePredictionGameRepository();
    const useCase = new GetPredictionGamesUseCase(repository);

    // UseCase 실행
    const result = await useCase.execute({
      filters: {
        status: status as any,
        category: category || undefined,
      },
      pagination: {
        limit,
        offset,
      },
      sorting: {
        field: sortBy,
        order: sortOrder as "asc" | "desc",
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FETCH_GAMES_FAILED",
            message: isFailure(result) ? result.error.message : "Unknown error",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        games: result.data.games,
        pagination: {
          total: result.data.total,
          limit,
          offset,
          hasMore: result.data.total > offset + limit,
        },
      },
      metadata: {
        timestamp: new Date(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error("GET /api/predictions/games error:", error);
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
 * POST /api/predictions/games
 * 새 예측 게임 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 요청 데이터 검증
    const validationResult = validateCreateGameRequest(body);
    if (!validationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: validationResult.errors,
          },
        },
        { status: 400 }
      );
    }

    // Repository 및 서비스 초기화
    const repository = new SupabasePredictionGameRepository();

    // UseCase 초기화
    const useCase = new CreatePredictionGameUseCase(repository);

    // Use case에서 요구하는 필드에 맞춰 요청 객체 생성
    const createRequest = {
      title: body.title,
      description: body.description,
      predictionType: body.predictionType,
      options: body.options,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      settlementTime: new Date(body.settlementTime),
      creatorId: body.creatorId as UserId,
      minimumStake: body.minimumStake,
      maximumStake: body.maximumStake,
      maxParticipants: body.maxParticipants,
    } as const;

    // UseCase 실행
    const result = await useCase.execute(createRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CREATE_GAME_FAILED",
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
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/predictions/games error:", error);
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
 * 게임 생성 요청 데이터 검증
 */
function validateCreateGameRequest(body: any): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!body.title || typeof body.title !== "string" || body.title.length < 5) {
    errors.push("Title must be at least 5 characters long");
  }

  if (
    !body.description ||
    typeof body.description !== "string" ||
    body.description.length < 20
  ) {
    errors.push("Description must be at least 20 characters long");
  }

  if (!["binary", "wdl", "ranking"].includes(body.predictionType)) {
    errors.push("Invalid prediction type");
  }

  if (!Array.isArray(body.options) || body.options.length < 2) {
    errors.push("At least 2 options are required");
  }

  if (!body.startTime || !body.endTime || !body.settlementTime) {
    errors.push("Start time, end time, and settlement time are required");
  }

  const startTime = new Date(body.startTime);
  const endTime = new Date(body.endTime);
  const settlementTime = new Date(body.settlementTime);

  if (startTime >= endTime) {
    errors.push("End time must be after start time");
  }

  if (endTime >= settlementTime) {
    errors.push("Settlement time must be after end time");
  }

  if (!body.creatorId) {
    errors.push("Creator ID is required");
  }

  if (!["low", "medium", "high", "critical"].includes(body.importance)) {
    errors.push("Invalid importance level");
  }

  if (!["easy", "medium", "hard", "expert"].includes(body.difficulty)) {
    errors.push("Invalid difficulty level");
  }

  if (typeof body.minimumStake !== "number" || body.minimumStake < 1) {
    errors.push("Minimum stake must be at least 1");
  }

  if (
    typeof body.maximumStake !== "number" ||
    body.maximumStake <= body.minimumStake
  ) {
    errors.push("Maximum stake must be greater than minimum stake");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
