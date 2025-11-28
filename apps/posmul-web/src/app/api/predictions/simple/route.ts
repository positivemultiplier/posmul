import { NextRequest, NextResponse } from "next/server";
import { 
  createPredictionGame, 
  getPredictionGames, 
  participateInGame,
  getUserEconomicBalance 
} from "../../../../lib/supabase/direct-client";

/**
 * GET /api/predictions/simple
 * 간단한 예측 게임 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ACTIVE";
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error } = await getPredictionGames({
      status,
      limit,
      offset
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: error.message
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        games: data || [],
        pagination: {
          total: (data || []).length,
          limit,
          offset,
          hasMore: (data || []).length === limit
        }
      }
    });
  } catch (error) {
    console.error('GET /api/predictions/simple error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unexpected error occurred'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/predictions/simple
 * 간단한 예측 게임 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 기본 검증
    if (!body.title || !body.description || !body.options) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields'
          }
        },
        { status: 400 }
      );
    }

    // 간단한 게임 데이터 생성
    const gameData = {
      title: body.title,
      description: body.description,
      predictionType: body.predictionType || 'binary' as const,
      options: body.options,
      startTime: new Date(body.startTime || new Date()),
      endTime: new Date(body.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24시간 후
      settlementTime: new Date(body.settlementTime || new Date(Date.now() + 48 * 60 * 60 * 1000)), // 48시간 후
      creatorId: body.creatorId || 'test-creator',
      minimumStake: body.minimumStake || 10,
      maximumStake: body.maximumStake || 100,
      maxParticipants: body.maxParticipants
    };

    const { data, error } = await createPredictionGame(gameData);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREATE_FAILED',
            message: error.message
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          gameId: data?.id,
          game: data
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/predictions/simple error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unexpected error occurred'
        }
      },
      { status: 500 }
    );
  }
}