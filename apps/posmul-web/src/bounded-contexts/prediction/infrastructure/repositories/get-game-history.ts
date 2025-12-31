/**
 * 게임 히스토리 조회 (Server-side only)
 * 
 * Server Component에서 직접 호출하여 초기 차트 데이터를 가져옵니다.
 * "use server" 없이 일반 함수로 사용하여 POST 요청을 방지합니다.
 */

import { createClient } from "@/lib/supabase/server";

export interface ChartDataPoint {
    time: string;
    [key: string]: string | number;
}

export async function getGameHistory(
    gameId: string,
    options: { id: string }[]
): Promise<ChartDataPoint[]> {
    const supabase = await createClient();

    // 해당 게임의 모든 유효 베팅 조회 (시간순)
    const { data: bets, error } = await supabase
        .schema("prediction")
        .from("predictions")
        .select("created_at, bet_amount, prediction_data")
        .eq("game_id", gameId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[getGameHistory] Error fetching bets:", error);
        return [];
    }

    console.log("[getGameHistory] gameId:", gameId);
    console.log("[getGameHistory] options:", options);
    console.log("[getGameHistory] bets count:", bets?.length ?? 0);

    if (!bets || bets.length === 0) {
        console.log("[getGameHistory] No bets found, returning empty array");
        return [];
    }

    // 시간대별 확률 추이 계산
    const points: ChartDataPoint[] = [];
    const optionInvestments: Record<string, number> = {};
    let totalInvestment = 0;

    options.forEach(opt => {
        optionInvestments[opt.id] = 0;
    });

    // 베팅 내역 순회하며 누적 확률 계산
    bets.forEach((bet) => {
        const pData = bet.prediction_data as { selectedOptionId: string };
        const optionId = pData.selectedOptionId;
        const amount = Number(bet.bet_amount);
        const createdAt = new Date(bet.created_at);

        if (optionInvestments[optionId] !== undefined) {
            optionInvestments[optionId] += amount;
            totalInvestment += amount;
        }

        const point: ChartDataPoint = {
            time: createdAt.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit"
            }),
        };

        options.forEach(opt => {
            const invest = optionInvestments[opt.id] || 0;
            const percentage = totalInvestment > 0
                ? Math.round((invest / totalInvestment) * 100)
                : 0;
            point[opt.id] = percentage;
        });

        points.push(point);
    });

    console.log("[getGameHistory] Generated points:", points.length);
    if (points.length > 0) {
        console.log("[getGameHistory] First point:", points[0]);
        console.log("[getGameHistory] Last point:", points[points.length - 1]);

        // 마지막 베팅 이후 현재 시점까지 그래프 연장
        const lastPoint = points[points.length - 1];
        const now = new Date();
        const nowTimeLabel = now.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit"
        });

        // 마지막 포인트와 현재 시간이 다르면 현재 포인트 추가
        if (lastPoint.time !== nowTimeLabel) {
            const currentPoint: ChartDataPoint = { time: nowTimeLabel };
            options.forEach(opt => {
                currentPoint[opt.id] = lastPoint[opt.id];
            });
            points.push(currentPoint);
            console.log("[getGameHistory] Added current point:", currentPoint);
        }
    }

    // 데이터 포인트가 너무 많으면 샘플링
    if (points.length > 100) {
        const sampledPoints: ChartDataPoint[] = [];
        const step = Math.ceil(points.length / 100);
        for (let i = 0; i < points.length; i += step) {
            sampledPoints.push(points[i]);
        }
        if (sampledPoints[sampledPoints.length - 1] !== points[points.length - 1]) {
            sampledPoints.push(points[points.length - 1]);
        }
        return sampledPoints;
    }

    return points;
}
