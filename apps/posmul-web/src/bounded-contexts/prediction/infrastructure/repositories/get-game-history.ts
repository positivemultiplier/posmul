/**
 * 게임 히스토리 조회 (Server-side only)
 * 
 * 스냅샷 테이블에서 사전 계산된 확률 데이터를 가져옵니다.
 * 스냅샷이 없으면 실시간 계산으로 폴백합니다.
 */

import { createClient } from "@/lib/supabase/server";

export interface ChartDataPoint {
    time: string;
    [key: string]: string | number;
}

/**
 * 스냅샷 기반 게임 히스토리 조회 (최적화)
 * - 1차: prediction.game_snapshots 조회 (사전 계산, 초고속)
 * - 2차: 스냅샷 없으면 실시간 계산 폴백
 */
export async function getGameHistory(
    gameId: string,
    options: { id: string }[]
): Promise<ChartDataPoint[]> {
    const supabase = await createClient();

    // 1차: 스냅샷에서 조회 (최적화 경로)
    const { data: snapshots, error: snapError } = await supabase
        .schema("prediction")
        .from("game_snapshots")
        .select("snapshot_time, option_id, probability")
        .eq("game_id", gameId)
        .order("snapshot_time", { ascending: true });

    if (!snapError && snapshots && snapshots.length > 0) {
        return convertSnapshotsToChartData(snapshots, options);
    }

    // 2차: 폴백 - 실시간 계산 (스냅샷 없는 경우)
    return getGameHistoryFallback(gameId, options, supabase);
}

/**
 * 스냅샷 데이터를 ChartDataPoint 배열로 변환
 */
function convertSnapshotsToChartData(
    snapshots: Array<{ snapshot_time: string; option_id: string; probability: number }>,
    options: { id: string }[]
): ChartDataPoint[] {
    // 시간별로 그룹핑
    const timeGroups = new Map<string, ChartDataPoint>();

    for (const snap of snapshots) {
        const time = new Date(snap.snapshot_time).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit"
        });

        if (!timeGroups.has(snap.snapshot_time)) {
            const point: ChartDataPoint = { time };
            // 모든 옵션 초기화
            options.forEach(opt => { point[opt.id] = 0; });
            timeGroups.set(snap.snapshot_time, point);
        }

        const point = timeGroups.get(snap.snapshot_time)!;
        point[snap.option_id] = Number(snap.probability);
    }

    const points = Array.from(timeGroups.values());

    // 100개 넘으면 샘플링
    if (points.length > 100) {
        return samplePoints(points);
    }

    return points;
}

/**
 * 폴백: 실시간 계산 (스냅샷 없을 때만 사용)
 */
async function getGameHistoryFallback(
    gameId: string,
    options: { id: string }[],
    supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ChartDataPoint[]> {
    const { data: bets, error } = await supabase
        .schema("prediction")
        .from("predictions")
        .select("created_at, bet_amount, prediction_data")
        .eq("game_id", gameId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    if (error || !bets || bets.length === 0) {
        return [];
    }

    const points: ChartDataPoint[] = [];
    const optionInvestments: Record<string, number> = {};
    let totalInvestment = 0;

    options.forEach(opt => { optionInvestments[opt.id] = 0; });

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
            point[opt.id] = totalInvestment > 0
                ? Math.round((invest / totalInvestment) * 100)
                : 0;
        });

        points.push(point);
    });

    if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        const now = new Date();
        const nowTimeLabel = now.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit"
        });

        if (lastPoint.time !== nowTimeLabel) {
            const currentPoint: ChartDataPoint = { time: nowTimeLabel };
            options.forEach(opt => {
                currentPoint[opt.id] = lastPoint[opt.id];
            });
            points.push(currentPoint);
        }
    }

    return points.length > 100 ? samplePoints(points) : points;
}

/**
 * 데이터 포인트 샘플링 (100개 이하로)
 */
function samplePoints(points: ChartDataPoint[]): ChartDataPoint[] {
    const sampled: ChartDataPoint[] = [];
    const step = Math.ceil(points.length / 100);
    for (let i = 0; i < points.length; i += step) {
        sampled.push(points[i]);
    }
    if (sampled[sampled.length - 1] !== points[points.length - 1]) {
        sampled.push(points[points.length - 1]);
    }
    return sampled;
}
