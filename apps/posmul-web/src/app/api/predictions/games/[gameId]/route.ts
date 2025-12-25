import { PredictionGameId, UserId, isFailure } from "@posmul/auth-economy-sdk";

import { NextRequest, NextResponse } from "next/server";

import { DeletePredictionGameUseCase } from "../../../../../bounded-contexts/prediction/application/use-cases/delete-prediction-game.use-case";
import { GetPredictionGameByIdUseCase } from "../../../../../bounded-contexts/prediction/application/use-cases/get-prediction-game-by-id.use-case";
import { UpdatePredictionGameUseCase } from "../../../../../bounded-contexts/prediction/application/use-cases/update-prediction-game.use-case";
import { SupabasePredictionGameRepository } from "../../../../../bounded-contexts/prediction/infrastructure/repositories/supabase-prediction-game.repository";
import { toLegacyUserId } from "../../../../../shared/type-bridge";

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
    const repository = new SupabasePredictionGameRepository(
      process.env.SUPABASE_PROJECT_ID!
    );
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
 * PUT /api/predictions/games/[gameId]
 * 예측 게임 정보 수정 (생성자만 가능)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body: unknown = await request.json();

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
    const repository = new SupabasePredictionGameRepository(
      process.env.SUPABASE_PROJECT_ID!
    );
    const useCase = new UpdatePredictionGameUseCase(repository);

    const parsedBody = parseUpdateGameRequestBody(body);

    // UseCase 실행
    const result = await useCase.execute({
      gameId: gameId as PredictionGameId,
      updatedBy: toLegacyUserId(parsedBody.updatedBy as UserId),
      updates: {
        title: parsedBody.updates.title,
        description: parsedBody.updates.description,
        endTime: parsedBody.updates.endTime,
        settlementTime: parsedBody.updates.settlementTime,
        minimumStake: parsedBody.updates.minimumStake,
        maximumStake: parsedBody.updates.maximumStake,
        maxParticipants: parsedBody.updates.maxParticipants,
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
    const repository = new SupabasePredictionGameRepository(
      process.env.SUPABASE_PROJECT_ID!
    );
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

      if (
        isFailure(result) &&
        result.error.message.includes("cannot delete active")
      ) {
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
 * 게임 수정 요청 데이터 검증
 */
function validateUpdateGameRequest(body: unknown): {
  valid: boolean;
  errors?: string[];
} {
  if (!isRecord(body)) return { valid: false, errors: ["Invalid request body"] };

  const errors = collectUpdateGameRequestErrors(body);
  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

type UpdateGameRequestBodyParsed = {
  updatedBy: string;
  updates: {
    title?: string;
    description?: string;
    endTime?: Date;
    settlementTime?: Date;
    minimumStake?: number;
    maximumStake?: number;
    maxParticipants?: number;
  };
};

function parseUpdateGameRequestBody(body: unknown): UpdateGameRequestBodyParsed {
  if (!isRecord(body)) {
    return { updatedBy: "", updates: {} };
  }

  const updatedBy = isNonEmptyString(body["updatedBy"]) ? body["updatedBy"] : "";

  const title = typeof body["title"] === "string" ? body["title"] : undefined;
  const description = typeof body["description"] === "string" ? body["description"] : undefined;
  const endTime = parseOptionalDate(body["endTime"]);
  const settlementTime = parseOptionalDate(body["settlementTime"]);
  const minimumStake = typeof body["minimumStake"] === "number" ? body["minimumStake"] : undefined;
  const maximumStake = typeof body["maximumStake"] === "number" ? body["maximumStake"] : undefined;
  const maxParticipants = typeof body["maxParticipants"] === "number" ? body["maxParticipants"] : undefined;

  return {
    updatedBy,
    updates: {
      title,
      description,
      endTime,
      settlementTime,
      minimumStake,
      maximumStake,
      maxParticipants,
    },
  };
}

function collectUpdateGameRequestErrors(body: Record<string, unknown>): string[] {
  return [
    ...validateUpdatedBy(body),
    ...validateOptionalMinLengthString(body, "title", 5, "Title must be at least 5 characters long"),
    ...validateOptionalMinLengthString(
      body,
      "description",
      20,
      "Description must be at least 20 characters long"
    ),
    ...validateTimeOrder(body),
    ...validateMinimumStake(body),
    ...validateMaximumStake(body),
    ...validateMaxParticipants(body),
  ];
}

function validateUpdatedBy(body: Record<string, unknown>): string[] {
  const updatedBy = body["updatedBy"];
  if (!isNonEmptyString(updatedBy)) return ["Updated by user ID is required"];
  return [];
}

function validateOptionalMinLengthString(
  body: Record<string, unknown>,
  key: string,
  minLength: number,
  errorMessage: string
): string[] {
  const value = body[key];
  if (value === undefined) return [];
  if (typeof value !== "string") return [errorMessage];
  if (value.length < minLength) return [errorMessage];
  return [];
}

function validateTimeOrder(body: Record<string, unknown>): string[] {
  const endTime = parseOptionalDate(body["endTime"]);
  const settlementTime = parseOptionalDate(body["settlementTime"]);
  if (!endTime || !settlementTime) return [];
  if (endTime >= settlementTime) return ["Settlement time must be after end time"];
  return [];
}

function validateMinimumStake(body: Record<string, unknown>): string[] {
  const minimumStake = body["minimumStake"];
  if (minimumStake === undefined) return [];
  if (typeof minimumStake !== "number" || minimumStake < 1) return ["Minimum stake must be at least 1"];
  return [];
}

function validateMaximumStake(body: Record<string, unknown>): string[] {
  const minimumStake = body["minimumStake"];
  const maximumStake = body["maximumStake"];
  if (typeof minimumStake !== "number" || typeof maximumStake !== "number") return [];
  if (maximumStake <= minimumStake) return ["Maximum stake must be greater than minimum stake"];
  return [];
}

function validateMaxParticipants(body: Record<string, unknown>): string[] {
  const maxParticipants = body["maxParticipants"];
  if (maxParticipants === undefined) return [];
  if (typeof maxParticipants !== "number" || maxParticipants < 1) {
    return ["Maximum participants must be at least 1"];
  }
  return [];
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
