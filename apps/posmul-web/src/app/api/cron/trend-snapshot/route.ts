
import { NextRequest, NextResponse } from "next/server";
import { predictionTrendService } from "@/bounded-contexts/prediction/application/services/prediction-trend.service";

/**
 * CRON Job: Trend Snapshot
 * 주기적으로 실행되어 활성 게임의 베팅 분포를 기록합니다.
 */
export async function GET(req: NextRequest) {
    // 간단한 보안 체크 (CRON_SECRET 환경변수 확인)
    // 실제 운영 배포 시에는 Vercel Cron 등의 헤더를 검증해야 함
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
