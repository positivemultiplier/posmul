import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type HealthStatus = "healthy" | "unhealthy" | "unknown";

async function checkDatabaseHealth(): Promise<HealthStatus> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "unknown";
  }

  try {
    const { error } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id", { head: true, count: "exact" })
      .limit(1);

    return error ? "unhealthy" : "healthy";
  } catch {
    return "unhealthy";
  }
}

/**
 * GET /api/health
 * API 시스템 헬스체크
 */
export async function GET(request: NextRequest) {
  void request;
  try {
    const startTime = Date.now();
    const databaseHealth = await checkDatabaseHealth();

    // 기본 시스템 상태 확인
    const systemHealth: {
      api: HealthStatus;
      database: HealthStatus;
      cache: HealthStatus;
      events: HealthStatus;
    } = {
      api: "healthy",
      database: databaseHealth,
      cache: "unknown", // 향후 Redis 도입 시 연결 테스트 확장
      events: "healthy",
    };

    // 응답 시간 계산
    const responseTime = Date.now() - startTime;

    // 전체 상태 판단
    const isHealthy = Object.values(systemHealth).every(
      (status) => status === "healthy" || status === "unknown"
    );

    return NextResponse.json(
      {
        success: true,
        status: isHealthy ? "healthy" : "degraded",
        data: {
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime}ms`,
          version: "1.0.0",
          environment: process.env.NODE_ENV || "development",
          services: systemHealth,
          uptime: process.uptime(),
        },
        metadata: {
          timestamp: new Date(),
          version: "1.0.0",
        },
      },
      {
        status: isHealthy ? 200 : 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    void error;
    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        error: {
          code: "HEALTH_CHECK_FAILED",
          message: "Health check failed",
        },
        data: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          environment: process.env.NODE_ENV || "development",
        },
      },
      { status: 503 }
    );
  }
}
