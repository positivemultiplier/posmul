import { createPmpAmount, createUserId, isFailure } from "@posmul/auth-economy-sdk";

import { NextRequest, NextResponse } from "next/server";

import { CreatePredictionGameUseCase } from "../../../../bounded-contexts/prediction/application/use-cases/create-prediction-game.use-case";
import { GetPredictionGamesUseCase } from "../../../../bounded-contexts/prediction/application/use-cases/get-prediction-games.use-case";
import { SupabasePredictionGameRepository } from "../../../../bounded-contexts/prediction/infrastructure/repositories/supabase-prediction-game.repository";
import { MoneyWaveCalculatorService } from "../../../../shared/economy-kernel/services/money-wave-calculator.service";
import type { GameOptions } from "../../../../bounded-contexts/prediction/domain/value-objects/prediction-types";

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
    const repository = new SupabasePredictionGameRepository(
      process.env.SUPABASE_PROJECT_ID!
    );
    const useCase = new GetPredictionGamesUseCase(repository);

    // UseCase 실행
    const result = await useCase.execute({
      filters: {
        status,
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
 * POST /api/predictions/games
 * 새 예측 게임 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

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
    const repository = new SupabasePredictionGameRepository(
      process.env.SUPABASE_PROJECT_ID!
    );
    
    // MoneyWaveCalculatorService 초기화 (연간 EBIT 1조 7,520억원 - 시간별 2억 MoneyWave 목표)
    const moneyWaveCalculator = new MoneyWaveCalculatorService(1752000000000);

    // UseCase 초기화
    const useCase = new CreatePredictionGameUseCase(repository, moneyWaveCalculator);

    // Use case에서 요구하는 필드에 맞춰 요청 객체 생성
    const validatedBody = validationResult.data;
    const createRequest = {
      title: validatedBody.title,
      description: validatedBody.description,
      predictionType: validatedBody.predictionType,
      options: validatedBody.options,
      startTime: validatedBody.startTime,
      endTime: validatedBody.endTime,
      settlementTime: validatedBody.settlementTime,
      creatorId: createUserId(validatedBody.creatorId),
      minimumStake: createPmpAmount(validatedBody.minimumStake),
      maximumStake: createPmpAmount(validatedBody.maximumStake),
      maxParticipants: validatedBody.maxParticipants,
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
 * 게임 생성 요청 데이터 검증
 */
function validateCreateGameRequest(body: any): {
  valid: true;
  data: {
    title: string;
    description: string;
    predictionType: "binary" | "wdl" | "ranking";
    options: GameOptions;
    startTime: Date;
    endTime: Date;
    settlementTime: Date;
    creatorId: string;
    minimumStake: number;
    maximumStake: number;
    maxParticipants?: number;
  };
} | {
  valid: false;
  errors: string[];
} {
  if (!isRecord(body)) return { valid: false, errors: ["Invalid request body"] };

  const parsed = parseCreateGameRequestBody(body);
  if (!parsed.ok) return { valid: false, errors: parsed.errors };
  return { valid: true, data: parsed.value };
}

type CreateGameRequestBodyParsed = {
  title: string;
  description: string;
  predictionType: "binary" | "wdl" | "ranking";
  options: GameOptions;
  startTime: Date;
  endTime: Date;
  settlementTime: Date;
  creatorId: string;
  minimumStake: number;
  maximumStake: number;
  maxParticipants?: number;
};

type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

function parseCreateGameRequestBody(body: Record<string, unknown>): ParseResult<CreateGameRequestBodyParsed> {
  const errors: string[] = [];

  const title = requireStringMin(body, "title", 5, "Title must be at least 5 characters long", errors);
  const description = requireStringMin(body, "description", 20, "Description must be at least 20 characters long", errors);
  const predictionType = requirePredictionType(body, "predictionType", errors);
  const options = requireGameOptions(body, "options", errors);

  const startTime = requireDate(body, "startTime", errors);
  const endTime = requireDate(body, "endTime", errors);
  const settlementTime = requireDate(body, "settlementTime", errors);
  validateDateOrder(startTime, endTime, settlementTime, errors);

  const creatorId = requireNonEmptyString(body, "creatorId", "Creator ID is required", errors);

  requireEnum(body, "importance", ["low", "medium", "high", "critical"] as const, "Invalid importance level", errors);
  requireEnum(body, "difficulty", ["easy", "medium", "hard", "expert"] as const, "Invalid difficulty level", errors);

  const minimumStake = requireNumberMin(body, "minimumStake", 1, "Minimum stake must be at least 1", errors);
  const maximumStake = requireNumber(body, "maximumStake", "Maximum stake must be greater than minimum stake", errors);
  validateMaxGreaterThanMin(maximumStake, minimumStake, errors);

  const maxParticipants = asOptionalNumber(body["maxParticipants"]);

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      title: title!,
      description: description!,
      predictionType: predictionType!,
      options: options!,
      startTime: startTime!,
      endTime: endTime!,
      settlementTime: settlementTime!,
      creatorId: creatorId!,
      minimumStake: minimumStake!,
      maximumStake: maximumStake!,
      maxParticipants,
    },
  };
}

function requireNonEmptyString(
  body: Record<string, unknown>,
  key: string,
  errorMessage: string,
  errors: string[]
): string | null {
  const value = asNonEmptyString(body[key]);
  if (!value) errors.push(errorMessage);
  return value;
}

function requireStringMin(
  body: Record<string, unknown>,
  key: string,
  minLength: number,
  errorMessage: string,
  errors: string[]
): string | null {
  const value = asNonEmptyString(body[key]);
  if (!value || value.length < minLength) {
    errors.push(errorMessage);
    return null;
  }
  return value;
}

function requireNumber(
  body: Record<string, unknown>,
  key: string,
  errorMessage: string,
  errors: string[]
): number | null {
  const value = asNumber(body[key]);
  if (value === null) errors.push(errorMessage);
  return value;
}

function requireNumberMin(
  body: Record<string, unknown>,
  key: string,
  min: number,
  errorMessage: string,
  errors: string[]
): number | null {
  const value = asNumber(body[key]);
  if (value === null || value < min) {
    errors.push(errorMessage);
    return null;
  }
  return value;
}

function validateMaxGreaterThanMin(max: number | null, min: number | null, errors: string[]) {
  if (max === null || min === null) return;
  if (max <= min) errors.push("Maximum stake must be greater than minimum stake");
}

function requireDate(body: Record<string, unknown>, key: string, errors: string[]): Date | null {
  const parsed = asValidDate(body[key]);
  if (!parsed) errors.push("Start time, end time, and settlement time are required");
  return parsed;
}

function validateDateOrder(startTime: Date | null, endTime: Date | null, settlementTime: Date | null, errors: string[]) {
  if (!startTime || !endTime || !settlementTime) return;
  if (startTime >= endTime) errors.push("End time must be after start time");
  if (endTime >= settlementTime) errors.push("Settlement time must be after end time");
}

function requireEnum<const T extends ReadonlyArray<string>>(
  body: Record<string, unknown>,
  key: string,
  allowed: T,
  errorMessage: string,
  errors: string[]
): T[number] | null {
  const value = asEnum(body[key], allowed);
  if (!value) errors.push(errorMessage);
  return value;
}

function requirePredictionType(
  body: Record<string, unknown>,
  key: string,
  errors: string[]
): "binary" | "wdl" | "ranking" | null {
  const value = asPredictionType(body[key]);
  if (!value) errors.push("Invalid prediction type");
  return value;
}

function requireGameOptions(body: Record<string, unknown>, key: string, errors: string[]): GameOptions | null {
  const options = asGameOptions(body[key]);
  if (!options) errors.push("At least 2 options are required");
  return options;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asOptionalNumber(value: unknown): number | undefined {
  const parsed = asNumber(value);
  return parsed === null ? undefined : parsed;
}

function asValidDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function asEnum<const T extends ReadonlyArray<string>>(value: unknown, allowed: T): T[number] | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T[number]) : null;
}

function asPredictionType(value: unknown): "binary" | "wdl" | "ranking" | null {
  return asEnum(value, ["binary", "wdl", "ranking"] as const);
}

function asGameOptions(value: unknown): GameOptions | null {
  if (!Array.isArray(value) || value.length < 2) return null;

  const options: GameOptions = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const id = asNonEmptyString(item["id"]);
    const label = asNonEmptyString(item["label"]);
    const description = item["description"];

    if (!id || !label) return null;
    if (description !== undefined && description !== null && typeof description !== "string") return null;

    options.push({
      id,
      label,
      ...(typeof description === "string" && description.trim().length > 0 ? { description } : {}),
    });
  }

  return options;
}
