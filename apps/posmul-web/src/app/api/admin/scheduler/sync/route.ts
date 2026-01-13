/**
 * 스케줄러 동기화 API 엔드포인트
 * 
 * Cron Job 또는 관리자 수동 트리거용
 */

import { NextRequest, NextResponse } from "next/server";

// 임시: 실제로는 DI 컨테이너에서 가져와야 함
// import { getMasterScheduler } from "@/bounded-contexts/prediction/application/services/master-game-scheduler.service";

export async function POST(request: NextRequest) {
    try {
        // 인증 확인 (Cron 시크릿 또는 관리자 세션)
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        // 관리자 세션 확인 (TODO: 실제 인증 로직)
        const isAdmin = true; // 임시

        if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isAdmin) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 스케줄러 동기화 실행
        // const scheduler = getMasterScheduler(createGameUseCase);
        // await scheduler.triggerSync();

        // 임시 응답 (실제 구현 시 교체)
        const result = {
            success: true,
            message: "스케줄러 동기화 완료",
            syncedAt: new Date().toISOString(),
            stats: {
                footballGames: 3,
                earningsGames: 2,
                templateGames: 5,
            },
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("[Scheduler Sync API] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// GET: 스케줄러 상태 조회
export async function GET() {
    try {
        // 임시 상태 반환 (실제 구현 시 교체)
        const status = {
            isRunning: true,
            footballEnabled: true,
            earningsEnabled: true,
            templatesCount: 13,
            lastSync: new Date().toISOString(),
            nextSync: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            upcomingGames: [
                { id: "1", title: "맨유 vs 첼시", scheduledAt: "2026-01-13T22:00:00Z" },
                { id: "2", title: "나스닥 등락", scheduledAt: "2026-01-13T20:00:00Z" },
            ],
        };

        return NextResponse.json(status);
    } catch (error) {
        console.error("[Scheduler Status API] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
