import { PredictionGameId, UserId, isFailure } from "@posmul/auth-economy-sdk";
import { NextRequest, NextResponse } from "next/server";
import { toLegacyUserId } from "../../../../../shared/type-bridge";
import { DeletePredictionGameUseCase } from "../../../../../bounded-contexts/prediction/application/use-cases/delete-prediction-game.use-case";
import { GetPredictionGameByIdUseCase } from "../../../../../bounded-contexts/prediction/application/use-cases/get-prediction-game-by-id.use-case";
import { UpdatePredictionGameUseCase } from "../../../../../bounded-contexts/prediction/application/use-cases/update-prediction-game.use-case";
import { SupabasePredictionGameRepository } from "../../../../../bounded-contexts/prediction/infrastructure/repositories/supabase-prediction-game.repository";

/**
 * GET /api/predictions/games/[gameId]
 * 특정 예측 게임 상세 조회
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

    // Repository 및 UseCase 초기화
    const repository = new SupabasePredictionGameRepository(process.env.SUPABASE_PROJECT_ID!);
    const useCase = new GetPredictionGameByIdUseCase(repository);

    // UseCase 실행
    const result = await useCase.execute({
      gameId: gameId as PredictionGameId,
      includeParticipations: true,
      includeStatistics: true,
    });

    if (!result.success) {
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

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FETCH_GAME_FAILED",
            message: isFailure(result) ? result.error.message : "Unknown error",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        timestamp: new Date(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error(`GET /api/predictions/games/[gameId] error:`, error);
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
 * PUT /api/predictions/games/[gameId]
 * 예측 게임 정보 수정 (생성자만 가능)
 */
export async function PUT(
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

    // 요청 데이터 검증
    const validationResult = validateUpdateGameRequest(body);
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

    // Repository 및 UseCase 초기화
    const repository = new SupabasePredictionGameRepository(process.env.SUPABASE_PROJECT_ID!);
    const useCase = new UpdatePredictionGameUseCase(repository);

    // UseCase 실행
    const result = await useCase.execute({
      gameId: gameId as PredictionGameId,
      updatedBy: toLegacyUserId(body.updatedBy as UserId),
      updates: {
        title: body.title,
        description: body.description,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        settlementTime: body.settlementTime
          ? new Date(body.settlementTime)
          : undefined,
        minimumStake: body.minimumStake,
        maximumStake: body.maximumStake,
        maxParticipants: body.maxParticipants,
      },
    });

    if (!result.success) {
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

      if (isFailure(result) && result.error.message.includes("unauthorized")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Only the game creator can update this game",
            },
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UPDATE_GAME_FAILED",
            message: isFailure(result) ? result.error.message : "Unknown error",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        timestamp: new Date(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error(`PUT /api/predictions/games/[gameId] error:`, error);
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
 * DELETE /api/predictions/games/[gameId]
 * 예측 게임 삭제 (생성자 또는 관리자만 가능)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { searchParams } = new URL(request.url);
    const deletedBy = searchParams.get("deletedBy");
    const reason = searchParams.get("reason") || "User requested deletion";

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

    if (!deletedBy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_USER_ID",
            message: "User ID is required for deletion",
          },
        },
        { status: 400 }
      );
    }

    // Repository 및 UseCase 초기화
    const repository = new SupabasePredictionGameRepository(process.env.SUPABASE_PROJECT_ID!);
    const useCase = new DeletePredictionGameUseCase(repository);

    // UseCase 실행
    const result = await useCase.execute({
      gameId: gameId as PredictionGameId,
      deletedBy: toLegacyUserId(deletedBy as UserId),
      reason,
    });

    if (!result.success) {
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

      if (isFailure(result) && result.error.message.includes("unauthorized")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Only the game creator or admin can delete this game",
            },
          },
          { status: 403 }
        );
      }

      if (isFailure(result) && result.error.message.includes("cannot delete active")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CANNOT_DELETE_ACTIVE_GAME",
              message: "Cannot delete an active game with participants",
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DELETE_GAME_FAILED",
            message: isFailure(result) ? result.error.message : "Unknown error",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        gameId,
        deletedAt: new Date(),
        reason,
      },
      metadata: {
        timestamp: new Date(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error(`DELETE /api/predictions/games/[gameId] error:`, error);
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
 * 게임 수정 요청 데이터 검증
 */
function validateUpdateGameRequest(body: any): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!body.updatedBy) {
    errors.push("Updated by user ID is required");
  }

  if (body.title && (typeof body.title !== "string" || body.title.length < 5)) {
    errors.push("Title must be at least 5 characters long");
  }

  if (
    body.description &&
    (typeof body.description !== "string" || body.description.length < 20)
  ) {
    errors.push("Description must be at least 20 characters long");
  }

  if (body.endTime && body.settlementTime) {
    const endTime = new Date(body.endTime);
    const settlementTime = new Date(body.settlementTime);

    if (endTime >= settlementTime) {
      errors.push("Settlement time must be after end time");
    }
  }

  if (
    body.minimumStake &&
    (typeof body.minimumStake !== "number" || body.minimumStake < 1)
  ) {
    errors.push("Minimum stake must be at least 1");
  }

  if (
    body.maximumStake &&
    body.minimumStake &&
    body.maximumStake <= body.minimumStake
  ) {
    errors.push("Maximum stake must be greater than minimum stake");
  }

  if (
    body.maxParticipants &&
    (typeof body.maxParticipants !== "number" || body.maxParticipants < 1)
  ) {
    errors.push("Maximum participants must be at least 1");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
