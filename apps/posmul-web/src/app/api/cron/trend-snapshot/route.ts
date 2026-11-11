
import { NextRequest, NextResponse } from "next/server";
import { predictionTrendService } from "@/bounded-contexts/prediction/application/services/prediction-trend.service";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

/**
 * CRON Job: Trend Snapshot
 * 주기적으로 실행되어 활성 게임의 베팅 분포를 기록합니다.
 */
export async function GET(req: NextRequest) {
    const auth = await requireAdminApi(req, { allowCronSecret: true });
    if (!auth.ok) return auth.response;

    try {
        const result = await predictionTrendService.snapshotActiveGames();
        return NextResponse.json({
            success: true,
            message: "Trend snapshot executed",
            processed: result.processed
        });
    } catch (error) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
